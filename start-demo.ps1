$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  MFE Platform Demo - Preparar e iniciar ambiente" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$Root = $PSScriptRoot
$ReleasesPath = Join-Path $Root "releases"
if (-not (Test-Path $ReleasesPath)) {
  New-Item -ItemType Directory -Path $ReleasesPath | Out-Null
}

function Get-ListeningPids {
  param([int]$Port)

  $pids = @()
  try {
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
    $pids = $connections |
      Select-Object -ExpandProperty OwningProcess -Unique |
      Where-Object { $_ -and $_ -ne 0 }
  } catch {
    try {
      $lines = netstat -ano -p TCP | Select-String -Pattern "LISTENING"
      foreach ($line in $lines) {
        $parts = ($line.Line -split "\s+") | Where-Object { $_ }
        if ($parts.Count -lt 5) {
          continue
        }
        $localAddress = $parts[1]
        if ($localAddress -match "[:\]]$Port$") {
          $pidValue = $parts[-1]
          if ($pidValue -match "^\d+$") {
            $pids += [int]$pidValue
          }
        }
      }
    } catch {
      throw "Nao foi possivel verificar a porta $Port."
    }
  }

  return $pids | Select-Object -Unique
}

function Describe-Process {
  param([int]$Pid)

  $process = Get-Process -Id $Pid -ErrorAction SilentlyContinue
  if ($process) {
    return "$($process.ProcessName) (PID $Pid)"
  }

  return "PID $Pid"
}

function Stop-ProcessOnPort {
  param([int]$Port)

  try {
    $pids = Get-ListeningPids -Port $Port
  } catch {
    Write-Host ">>> Nao foi possivel verificar a porta $Port." -ForegroundColor DarkYellow
    return $false
  }

  if (-not $pids) {
    return $true
  }

  foreach ($processId in $pids) {
    Write-Host ">>> Encerrando processo na porta $Port (PID $processId)..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }

  $deadline = (Get-Date).AddSeconds(5)
  do {
    Start-Sleep -Milliseconds 200
    $remaining = Get-ListeningPids -Port $Port
  } while ($remaining -and (Get-Date) -lt $deadline)

  if ($remaining) {
    Write-Host ">>> Porta $Port continua em uso. Encerre o processo ou execute como Administrador." -ForegroundColor Red
    foreach ($processId in $remaining) {
      Write-Host ("    - {0}" -f (Describe-Process -Pid $processId)) -ForegroundColor Red
    }
    return $false
  }

  return $true
}

function Update-SharedLogicIntegrity {
  param(
    [string]$LockPath,
    [string]$Integrity
  )

  if (-not (Test-Path $LockPath)) {
    return
  }

  $content = Get-Content -LiteralPath $LockPath -Raw
  $pattern = '(?s)("node_modules/shared-logic"\s*:\s*\{.*?"integrity"\s*:\s*")[^"]+(")'
  $updated = [Regex]::Replace($content, $pattern, "`$1$Integrity`$2")
  if ($updated -ne $content) {
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($LockPath, $updated, $utf8NoBom)
  }
}

# Limpar cache do Native Federation
Write-Host "`n>>> Limpando cache do Native Federation..." -ForegroundColor Yellow
$cachePaths = @(
  (Join-Path $Root "host-shell\node_modules\.cache\native-federation"),
  (Join-Path $Root "remote-sales\node_modules\.cache\native-federation"),
  (Join-Path $Root "remote-gde\node_modules\.cache\native-federation"),
  (Join-Path $Root "remote-accounts\node_modules\.cache\native-federation")
)

foreach ($path in $cachePaths) {
  if (Test-Path $path) {
    Remove-Item -Recurse -Force $path
  }
}

# 1. Build shared-logic (gera .tgz)
Write-Host "`n>>> [1/12] Build shared-logic..." -ForegroundColor Green
Set-Location (Join-Path $Root "shared-logic")
npm install
if ($LASTEXITCODE -ne 0) { Write-Error "Falha no npm install do shared-logic"; exit 1 }
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Falha no build do shared-logic"; exit 1 }
npm pack --pack-destination $ReleasesPath
if ($LASTEXITCODE -ne 0) { Write-Error "Falha no npm pack do shared-logic"; exit 1 }
$sharedLogicVersion = (Get-Content package.json | ConvertFrom-Json).version
$sharedLogicPack = Join-Path $ReleasesPath ("shared-logic-" + $sharedLogicVersion + ".tgz")
$sharedLogicStable = Join-Path $ReleasesPath "shared-logic.tgz"
if (Test-Path $sharedLogicPack) {
  Copy-Item -Path $sharedLogicPack -Destination $sharedLogicStable -Force
}
if (Test-Path $sharedLogicStable) {
  Write-Host ">>> Atualizando integridade do shared-logic nos package-locks..." -ForegroundColor Yellow
  $hashBytes = [System.Security.Cryptography.SHA512]::Create().ComputeHash(
    [System.IO.File]::ReadAllBytes($sharedLogicStable)
  )
  $sharedLogicIntegrity = "sha512-" + [Convert]::ToBase64String($hashBytes)
  $lockPaths = @(
    (Join-Path $Root "host-shell\package-lock.json"),
    (Join-Path $Root "remote-sales\package-lock.json"),
    (Join-Path $Root "remote-gde\package-lock.json"),
    (Join-Path $Root "remote-accounts\package-lock.json")
  )
  foreach ($lockPath in $lockPaths) {
    Update-SharedLogicIntegrity -LockPath $lockPath -Integrity $sharedLogicIntegrity
  }
}

# 2. Build shared-ui-lib
Write-Host "`n>>> [2/12] Build shared-ui-lib..." -ForegroundColor Green
Set-Location (Join-Path $Root "shared-ui-lib")
npm install
if ($LASTEXITCODE -ne 0) { Write-Error "Falha no npm install do shared-ui-lib"; exit 1 }
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Falha no build do shared-ui-lib"; exit 1 }

# 3. Instalar Host
Write-Host "`n>>> [3/12] Instalando Host Shell..." -ForegroundColor Green
Set-Location (Join-Path $Root "host-shell")
npm run install:legacy
if ($LASTEXITCODE -ne 0) { Write-Error "Falha no npm install do Host"; exit 1 }

# 4. Instalar Remote
Write-Host "`n>>> [4/12] Instalando Remote Sales..." -ForegroundColor Green
Set-Location (Join-Path $Root "remote-sales")
npm run install:legacy
if ($LASTEXITCODE -ne 0) { Write-Error "Falha no npm install do Remote"; exit 1 }

# 5. Instalar Remote GDE
Write-Host "`n>>> [5/12] Instalando Remote GDE..." -ForegroundColor Green
Set-Location (Join-Path $Root "remote-gde")
npm run install:legacy
if ($LASTEXITCODE -ne 0) { Write-Error "Falha no npm install do Remote GDE"; exit 1 }

# 6. Instalar Remote Accounts
Write-Host "`n>>> [6/12] Instalando Remote Accounts..." -ForegroundColor Green
Set-Location (Join-Path $Root "remote-accounts")
npm run install:legacy
if ($LASTEXITCODE -ne 0) { Write-Error "Falha no npm install do Remote Accounts"; exit 1 }

# 7. Instalar Remote Credito
Write-Host "`n>>> [7/12] Instalando Remote Credito..." -ForegroundColor Green
Set-Location (Join-Path $Root "remote-credito")
npm run install:legacy
if ($LASTEXITCODE -ne 0) { Write-Error "Falha no npm install do Remote Credito"; exit 1 }

# 8. Ajustar dependencias (patch Native Federation)


# 8. Build Host
Write-Host "`n>>> [8/12] Build Host Shell..." -ForegroundColor Green
Set-Location (Join-Path $Root "host-shell")
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Falha no build do Host"; exit 1 }

# 9. Build Remote Sales
Write-Host "`n>>> [9/12] Build Remote Sales..." -ForegroundColor Green
Set-Location (Join-Path $Root "remote-sales")
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Falha no build do Remote"; exit 1 }

# 10. Build Remote GDE
Write-Host "`n>>> [10/12] Build Remote GDE..." -ForegroundColor Green
Set-Location (Join-Path $Root "remote-gde")
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Falha no build do Remote GDE"; exit 1 }

# 11. Build Remote Accounts
Write-Host "`n>>> [11/12] Build Remote Accounts..." -ForegroundColor Green
Set-Location (Join-Path $Root "remote-accounts")
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Falha no build do Remote Accounts"; exit 1 }

# 12. Build Remote Credito
Write-Host "`n>>> [12/12] Build Remote Credito..." -ForegroundColor Green
Set-Location (Join-Path $Root "remote-credito")
npm run build:element
if ($LASTEXITCODE -ne 0) { Write-Error "Falha no build do Remote Credito"; exit 1 }

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  Ambiente Pronto! Iniciando aplicacoes (dist)..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$portsToFree = @(4200, 4201, 4202, 4203, 4304)
foreach ($port in $portsToFree) {
  if (-not (Stop-ProcessOnPort -Port $port)) {
    Write-Host ">>> Abortando inicio. Porta $port ainda esta em uso." -ForegroundColor Red
    exit 1
  }
}

# Iniciar Remotes com build estático (Abrindo nova janela)
Write-Host ">>> Iniciando Remote Sales (Porta 4201)..." -ForegroundColor Yellow
Start-Process powershell -WorkingDirectory (Join-Path $Root "remote-sales") -ArgumentList "-NoExit", "npm run serve:dist"

# Iniciar Remote GDE com build estático (Abrindo nova janela)
Write-Host ">>> Iniciando Remote GDE (Porta 4202)..." -ForegroundColor Yellow
Start-Process powershell -WorkingDirectory (Join-Path $Root "remote-gde") -ArgumentList "-NoExit", "npm run serve:dist"

# Iniciar Remote Accounts com build estático (Abrindo nova janela)
Write-Host ">>> Iniciando Remote Accounts (Porta 4203)..." -ForegroundColor Yellow
Start-Process powershell -WorkingDirectory (Join-Path $Root "remote-accounts") -ArgumentList "-NoExit", "npm run serve:dist"

# Iniciar Remote Credito com build estático (Abrindo nova janela)
Write-Host ">>> Iniciando Remote Credito (Porta 4304)..." -ForegroundColor Yellow
Start-Process powershell -WorkingDirectory (Join-Path $Root "remote-credito") -ArgumentList "-NoExit", "npm run serve:element"

# Aguardar um pouco para garantir que o remote subiu
Start-Sleep -Seconds 2

# Iniciar Host com build estático (Abrindo nova janela)
Write-Host ">>> Iniciando Host Shell (Porta 4200)..." -ForegroundColor Yellow
Start-Process powershell -WorkingDirectory (Join-Path $Root "host-shell") -ArgumentList "-NoExit", "npm run serve:dist"
