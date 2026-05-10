$ErrorActionPreference = 'Stop'

$projectRoot = $PSScriptRoot
$backendPath = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'
$venvActivate = Join-Path $projectRoot '.venv\Scripts\Activate.ps1'

if (-not (Test-Path $venvActivate)) {
    throw "Environnement virtuel introuvable: $venvActivate"
}

function Start-NewTerminal {
    param(
        [string]$Title,
        [string]$WorkingDirectory,
        [string]$Command
    )

    $encodedCommand = @"
`$Host.UI.RawUI.WindowTitle = '$Title'
Set-Location '$WorkingDirectory'
. '$venvActivate'
$Command
"@

    Start-Process powershell.exe -ArgumentList @(
        '-NoExit',
        '-ExecutionPolicy', 'Bypass',
        '-Command', $encodedCommand
    ) | Out-Null
}

try {
    $ollamaPortInUse = Get-NetTCPConnection -LocalPort 11434 -State Listen -ErrorAction SilentlyContinue
} catch {
    $ollamaPortInUse = $null
}

if (-not $ollamaPortInUse) {
    Start-NewTerminal -Title 'Agent Debat - Ollama' -WorkingDirectory $projectRoot -Command "ollama serve"
} else {
    Write-Host 'Ollama est déjà en cours d''exécution sur le port 11434, lancement ignoré.'
}

Start-NewTerminal -Title 'Agent Debat - Backend' -WorkingDirectory $backendPath -Command "& '$projectRoot\\.venv\\Scripts\\python.exe' -m uvicorn main:app --reload --port 8000"
Start-NewTerminal -Title 'Agent Debat - Frontend' -WorkingDirectory $frontendPath -Command "npm run dev"

Write-Host 'Les 3 terminaux ont ete ouverts: Ollama, backend et frontend.'