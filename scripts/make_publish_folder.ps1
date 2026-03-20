$ErrorActionPreference = 'Stop'

$src = (Get-ChildItem -Path "C:\Users\zzrsn\Desktop" -Directory | Where-Object { $_.Name -like 'CV -*' } | Select-Object -First 1 -ExpandProperty FullName)
$dst = "C:\Users\zzrsn\Desktop\CV_PUBLISH"

if (!(Test-Path $src)) { throw "Source not found: $src" }

if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
New-Item -ItemType Directory -Path $dst | Out-Null

robocopy $src $dst /E /XD .git /R:1 /W:1 | Out-Null

Write-Host "Publish folder created:"
Get-ChildItem $dst | Select-Object Name
