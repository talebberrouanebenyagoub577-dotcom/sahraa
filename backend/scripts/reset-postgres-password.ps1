# Reset local PostgreSQL superuser password without dropping databases.
# Requires Administrator (edits pg_hba.conf under Program Files).
# Usage: .\scripts\reset-postgres-password.ps1 [-NewPassword "postgres"]

param(
  [string]$NewPassword = "postgres"
)

$ErrorActionPreference = "Stop"

$pgData = "C:\Program Files\PostgreSQL\17\data"
$pgBin = "C:\Program Files\PostgreSQL\17\bin"
$hbaPath = Join-Path $pgData "pg_hba.conf"
$backupPath = Join-Path $pgData "pg_hba.conf.sahraa-backup"
$serviceName = "postgresql-x64-17"

if (-not (Test-Path $hbaPath)) {
  throw "pg_hba.conf not found at $hbaPath"
}

function Restart-PostgresService {
  Restart-Service $serviceName -Force
  Start-Sleep -Seconds 3
  $svc = Get-Service $serviceName
  if ($svc.Status -ne "Running") {
    throw "PostgreSQL service failed to start after restart."
  }
}

Write-Host "Backing up pg_hba.conf..." -ForegroundColor Yellow
Copy-Item $hbaPath $backupPath -Force

$original = Get-Content $hbaPath -Raw
$trustBlock = @"

# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
local   replication     all                                     trust
host    replication     all             127.0.0.1/32            trust
host    replication     all             ::1/128                 trust
"@

try {
  Write-Host "Enabling temporary trust auth on localhost..." -ForegroundColor Yellow
  $headerEnd = $original.IndexOf("# TYPE  DATABASE")
  if ($headerEnd -lt 0) { throw "Unexpected pg_hba.conf format." }
  $header = $original.Substring(0, $headerEnd)
  [System.IO.File]::WriteAllText($hbaPath, $header + $trustBlock)
  Restart-PostgresService

  Write-Host "Resetting postgres superuser password..." -ForegroundColor Yellow
  $escaped = $NewPassword.Replace("'", "''")
  & (Join-Path $pgBin "psql.exe") -U postgres -h 127.0.0.1 -p 5432 -d postgres -v ON_ERROR_STOP=1 -c "ALTER USER postgres WITH PASSWORD '$escaped';"
  if ($LASTEXITCODE -ne 0) { throw "ALTER USER failed." }

  Write-Host "Password reset successful." -ForegroundColor Green
}
finally {
  Write-Host "Restoring pg_hba.conf..." -ForegroundColor Yellow
  [System.IO.File]::WriteAllText($hbaPath, $original)
  Restart-PostgresService
  Write-Host "Authentication restored to scram-sha-256." -ForegroundColor Green
}

Write-Host "New postgres superuser password: $NewPassword" -ForegroundColor Green
