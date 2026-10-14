# SAHRAA local PostgreSQL setup (Windows, no Docker)
# Usage: .\scripts\setup-local-db.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

function Read-DatabaseUrl {
  $envFile = Join-Path $ProjectRoot ".env"
  if (-not (Test-Path $envFile)) { throw ".env file not found at $envFile" }

  $line = Get-Content $envFile | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
  if (-not $line) { throw "DATABASE_URL is missing from .env" }

  $url = $line -replace '^DATABASE_URL=', '' -replace '^"', '' -replace '"$', ''
  if ($url -notmatch '^postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/([^?]+)') {
    throw "Could not parse DATABASE_URL: $url"
  }

  return @{
    User = $Matches[1]
    Password = $Matches[2]
    Host = $Matches[3]
    Port = $Matches[4]
    Database = $Matches[5]
    Url = $url
  }
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

Write-Host "=== SAHRAA local database setup ===" -ForegroundColor Cyan

& (Join-Path $PSScriptRoot "start-postgres-local.ps1")

$db = Read-DatabaseUrl
Write-Host "DATABASE_URL user: $($db.User)"
Write-Host "DATABASE_URL host: $($db.Host):$($db.Port)"
Write-Host "DATABASE_URL database: $($db.Database)"

if (-not (Test-PortOpen ([int]$db.Port))) {
  throw "PostgreSQL is not listening on port $($db.Port)."
}

Write-Host "Applying Prisma migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

Write-Host "Seeding database..." -ForegroundColor Yellow
npm run db:seed

Write-Host "Verifying default admin account..." -ForegroundColor Yellow
npx tsx scripts/verify-admin.ts

Write-Host ""
Write-Host "Done. Start the app with: npm run dev" -ForegroundColor Green
Write-Host "Login: admin@sahraa.com / Sahraa@2026" -ForegroundColor Green
