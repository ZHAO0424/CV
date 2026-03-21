param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$sourceFiles = Get-ChildItem -Path $Root -Recurse -Include *.html,*.css,*.js -File
$pattern = 'images/[^"''\)>]+\.(?:png|jpe?g|JPG)'

$refs = New-Object System.Collections.Generic.HashSet[string]
foreach ($file in $sourceFiles) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  foreach ($match in [regex]::Matches($content, $pattern)) {
    [void]$refs.Add($match.Value)
  }
}

function Get-WebpSettings {
  param(
    [string]$Ref,
    [string]$FullPath
  )

  $ext = [System.IO.Path]::GetExtension($FullPath).ToLowerInvariant()
  $quality = 82
  $maxDimension = 2400

  if ($ext -eq '.png') {
    $quality = 88
    $maxDimension = 2560
  }

  if ($Ref -like 'images/projects/photot/*') {
    $quality = 80
    $maxDimension = 2200
  }

  if ($Ref -like 'images/projects/architecture/*') {
    $quality = 84
    $maxDimension = 2200
  }

  if ($Ref -like 'images/projects/covers/*') {
    $quality = 84
    $maxDimension = 1800
  }

  return [pscustomobject]@{
    Quality = $quality
    MaxDimension = $maxDimension
  }
}

$converted = @()
$mappings = @()
foreach ($ref in $refs) {
  $diskRef = $ref -replace '/', '\\'
  $fullPath = Join-Path $Root $diskRef
  if (-not (Test-Path $fullPath)) { continue }

  $webpPath = [System.IO.Path]::ChangeExtension($fullPath, '.webp')
  $webpRef = [System.IO.Path]::ChangeExtension($ref, '.webp') -replace '\\','/'
  $settings = Get-WebpSettings -Ref $ref -FullPath $fullPath

  $shouldConvert = $true
  if (Test-Path $webpPath) {
    $srcTime = (Get-Item $fullPath).LastWriteTimeUtc
    $dstTime = (Get-Item $webpPath).LastWriteTimeUtc
    if ($dstTime -ge $srcTime) {
      $shouldConvert = $false
    }
  }

  if ($shouldConvert) {
    $vf = "scale='min($($settings.MaxDimension),iw)':'min($($settings.MaxDimension),ih)':force_original_aspect_ratio=decrease"
    & ffmpeg -y -loglevel error -i $fullPath -vf $vf -c:v libwebp -quality $settings.Quality -compression_level 6 $webpPath
    if ($LASTEXITCODE -ne 0) {
      throw "ffmpeg conversion failed for $fullPath"
    }
  }

  if (Test-Path $webpPath) {
    $srcSize = (Get-Item $fullPath).Length
    $dstSize = (Get-Item $webpPath).Length
    $converted += [pscustomobject]@{
      Ref = $ref
      OriginalMB = [math]::Round($srcSize / 1MB, 2)
      WebpMB = [math]::Round($dstSize / 1MB, 2)
      SavingsMB = [math]::Round(($srcSize - $dstSize) / 1MB, 2)
    }
    $mappings += [pscustomobject]@{
      OriginalRef = $ref
      WebpRef = $webpRef
      WebpPath = $webpPath
    }
  }
}

$updatedFiles = @()
foreach ($file in $sourceFiles) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $originalContent = $content
  foreach ($mapping in $mappings) {
    if ($content.Contains($mapping.OriginalRef)) {
      $content = $content.Replace($mapping.OriginalRef, $mapping.WebpRef)
    }
  }

  if ($content -ne $originalContent) {
    [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
    $updatedFiles += $file.FullName
  }
}

"Converted/verified WebP assets: $($mappings.Count)"
"Updated files: $($updatedFiles.Count)"
$converted | Sort-Object SavingsMB -Descending | Select-Object -First 20 | Format-Table -AutoSize
