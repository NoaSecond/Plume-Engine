# Vendoring script for Dear ImGui
# Usage (PowerShell from repo root):
#   .\scripts\vendor_imgui.ps1 -Tag v1.92.4

param(
  [string]$Repo = 'https://github.com/ocornut/imgui.git',
  [string]$Tag = 'v1.92.4'
)


# Compute destination folder (absolute) under repository root
$scriptRoot = Split-Path -Parent $PSScriptRoot
$relative = "..\src\ThirdParty\imgui"
$destCandidate = Join-Path -Path $scriptRoot -ChildPath $relative
$dest = (Resolve-Path -Path $destCandidate -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Path) -replace "\\$",""
if (-not $dest) { $dest = (Resolve-Path -Path (Join-Path -Path $scriptRoot -ChildPath $relative) -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Path) -replace "\\$","" }
if (-not $dest) { $dest = (Get-Item -Path (Join-Path -Path $scriptRoot -ChildPath $relative) -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName }) }
if (-not $dest) { $dest = Join-Path -Path $scriptRoot -ChildPath $relative }

Write-Host "Target directory: $dest"

if (Test-Path $dest) {
  Write-Host "Destination exists. Will attempt to update if it's a git repo."
  if (Test-Path (Join-Path $dest '.git')) {
    Push-Location $dest
    git fetch --all --tags
    git checkout $Tag
    git pull --ff-only
    Pop-Location
    Write-Host "Updated existing imgui checkout to tag $Tag"
    exit 0
  } else {
    Write-Host "Destination exists but is not a git repo. Aborting to avoid overwriting." -ForegroundColor Yellow
    exit 1
  }
}

# Clone a shallow copy of the requested tag
Write-Host "Cloning Dear ImGui ($Tag) into $dest"
git clone --depth 1 --branch $Tag $Repo $dest
if ($LASTEXITCODE -ne 0) {
  Write-Error "git clone failed with exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}

Write-Host "ImGui vendored to $dest"
Write-Host "You can now re-run CMake with -DPLUME_ENABLE_IMGUI=ON"
