# SAHRAA local PostgreSQL (no Docker)
# Uses the Windows PostgreSQL service when available; otherwise starts a project-local cluster.

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DataDir = Join-Path $ProjectRoot ".postgres-data"
$LogFile = Join-Path $DataDir "logfile"
$PwFile = Join-Path $ProjectRoot ".postgres-pw.txt"
$SuperPassword = $env:POSTGRES_SUPERUSER_PASSWORD
if (-not $SuperPassword) {
  $envFile = Join-Path $ProjectRoot ".env"
  if (Test-Path $envFile) {
    $line = Get-Content $envFile | Where-Object { $_ -match '^POSTGRES_SUPERUSER_PASSWORD=' } | Select-Object -First 1
    if ($line) {
      $SuperPassword = ($line -replace '^POSTGRES_SUPERUSER_PASSWORD=', '' -replace '^"', '' -replace '"$', '')
    }
  }
}
if (-not $SuperPassword) {
  throw "Set POSTGRES_SUPERUSER_PASSWORD in .env to the postgres superuser password chosen during installation."
}

function Test-PortOpen([int]$Port) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $client.Connect("127.0.0.1", $Port)
    $client.Close()
    return $true
  } catch {
    return $false
  }
}

function Find-PgBin {
  $cmd = Get-Command psql -ErrorAction SilentlyContinue
  if ($cmd) { return Split-Path $cmd.Source -Parent }

  $roots = @(
    "C:\Program Files\PostgreSQL\17\bin",
    "C:\Program Files\PostgreSQL\16\bin"
  )
  foreach ($root in $roots) {
    if (Test-Path (Join-Path $root "psql.exe")) { return $root }
  }
  throw "PostgreSQL binaries not found. Install PostgreSQL 16+ for Windows first."
}

function Ensure-AppDatabase {
  param([string]$PgBin)

  $psql = Join-Path $PgBin "psql.exe"
  $env:PGPASSWORD = $SuperPassword

  Write-Host "Ensuring app role and database exist..." -ForegroundColor Yellow
  & $psql -U postgres -h 127.0.0.1 -p 5432 -d postgres -v ON_ERROR_STOP=1 -c @"
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'sahraa') THEN
    CREATE ROLE sahraa WITH LOGIN PASSWORD 'sahraa_secret';
  END IF;
END
`$`$;
"@ | Out-Host
  if ($LASTEXITCODE -ne 0) { throw "Failed to create sahraa role." }

  $dbExistsRaw = & $psql -U postgres -h 127.0.0.1 -p 5432 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'sahraa'"
  if ($LASTEXITCODE -ne 0) { throw "Could not connect as postgres. Check POSTGRES_SUPERUSER_PASSWORD in .env." }
  $dbExists = ($dbExistsRaw | Out-String).Trim()
  if ($dbExists -ne "1") {
    & $psql -U postgres -h 127.0.0.1 -p 5432 -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE sahraa OWNER sahraa;" | Out-Host
  }

  & $psql -U postgres -h 127.0.0.1 -p 5432 -d postgres -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON DATABASE sahraa TO sahraa;" | Out-Host
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

$pgBin = Find-PgBin
Write-Host "Using PostgreSQL binaries: $pgBin"

if (Test-PortOpen 5432) {
  Write-Host "PostgreSQL is already running on port 5432." -ForegroundColor Green
  Ensure-AppDatabase -PgBin $pgBin
  Write-Host "App user: sahraa / sahraa_secret (matches .env DATABASE_URL)" -ForegroundColor DarkGray
  return
}

$libDir = Join-Path (Split-Path $pgBin -Parent) "lib"
if (-not (Test-Path $libDir)) {
  throw @"
PostgreSQL server files are missing (no lib folder).
Finish the PostgreSQL installer GUI if it is open, or reinstall from:
https://www.postgresql.org/download/windows/

Recommended installer settings:
  Port: 5432
  Superuser password: postgres
  Include PostgreSQL Server
"@
}

if (-not (Test-Path $DataDir)) {
  New-Item -ItemType Directory -Path $DataDir | Out-Null
}

if (-not (Test-Path (Join-Path $DataDir "PG_VERSION"))) {
  Write-Host "Initializing local PostgreSQL data directory..." -ForegroundColor Yellow
  Set-Content -Path $PwFile -Value $SuperPassword -NoNewline -Encoding ascii
  & (Join-Path $pgBin "initdb.exe") -D $DataDir -U postgres -E UTF8 -A scram-sha-256 --pwfile=$PwFile
}

Write-Host "Starting local PostgreSQL on port 5432..." -ForegroundColor Yellow
& (Join-Path $pgBin "pg_ctl.exe") -D $DataDir -l $LogFile -o "-p 5432" start
Start-Sleep -Seconds 2

if (-not (Test-PortOpen 5432)) {
  throw "PostgreSQL failed to start. Check $LogFile"
}

Ensure-AppDatabase -PgBin $pgBin

Write-Host "Local PostgreSQL is ready on localhost:5432" -ForegroundColor Green
Write-Host "Superuser: postgres / postgres (local dev only)" -ForegroundColor DarkGray
Write-Host "App user:  sahraa / sahraa_secret (matches .env DATABASE_URL)" -ForegroundColor DarkGray
