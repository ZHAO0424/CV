$ErrorActionPreference = 'Stop'

Set-Location (Join-Path $PSScriptRoot '..')

$src = 'images\projects\UCL\Full_VR_Video_injected.mp4'
$tmp = 'images\projects\UCL\Full_VR_Video_injected_1080p.mp4'

if (!(Test-Path $tmp)) { throw "Expected transcoded file not found: $tmp" }

# Ensure LFS rule exists.
git lfs track "*.mp4" | Out-Null
git add .gitattributes | Out-Null

# Remove the big file from the index (keep working tree), then replace on disk.
if (Test-Path $src) {
  git rm --cached $src | Out-Null
  Remove-Item -Force $src
}

Rename-Item -Force $tmp -NewName 'Full_VR_Video_injected.mp4'

git add $src | Out-Null

Write-Host "Staged:"
git status --porcelain=v1 | Select-Object -First 25

Write-Host "`nLFS:"
git lfs ls-files -l | Select-String -SimpleMatch "images/projects/UCL/Full_VR_Video_injected.mp4"
