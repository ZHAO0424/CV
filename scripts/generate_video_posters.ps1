param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$htmlFiles = Get-ChildItem -Path $Root -Recurse -Include *.html -File
$videoPattern = '<video\b[^>]*\bsrc="(?<src>[^"]+\.(?:mp4|mov|webm))"[^>]*></video>'
$processed = New-Object System.Collections.Generic.HashSet[string]
$posterMappings = @{}
$updatedFiles = @()

function Get-PosterRef([string]$videoRef) {
  $dir = [System.IO.Path]::GetDirectoryName($videoRef) -replace '\\','/'
  $name = [System.IO.Path]::GetFileNameWithoutExtension($videoRef)
  if ([string]::IsNullOrWhiteSpace($dir)) {
    return ($name + '.poster.webp')
  }
  return ($dir + '/' + $name + '.poster.webp')
}

foreach ($file in $htmlFiles) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $originalContent = $content
  $fileDir = [System.IO.Path]::GetDirectoryName($file.FullName)

  $content = [regex]::Replace(
    $content,
    $videoPattern,
    {
      param($match)
      $tag = $match.Value
      $src = $match.Groups['src'].Value
      $posterRef = Get-PosterRef $src
      $resolutionKey = "$($file.FullName)|$src"

      if (-not $processed.Contains($resolutionKey)) {
        [void]$processed.Add($resolutionKey)
        $videoFullPath = [System.IO.Path]::GetFullPath((Join-Path $fileDir ($src -replace '/', '\\')))
        $posterFullPath = [System.IO.Path]::GetFullPath((Join-Path $fileDir ($posterRef -replace '/', '\\')))

        if (Test-Path $videoFullPath) {
          $durationOutput = & ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 $videoFullPath
          $duration = 0.0
          [void][double]::TryParse(($durationOutput | Select-Object -First 1), [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$duration)
          $timestamp = 0.5
          if ($duration -gt 8) { $timestamp = 1.5 }
          elseif ($duration -gt 3) { $timestamp = 1.0 }
          elseif ($duration -gt 1) { $timestamp = [math]::Round($duration * 0.35, 2) }

          $needsPoster = $true
          if (Test-Path $posterFullPath) {
            $videoTime = (Get-Item $videoFullPath).LastWriteTimeUtc
            $posterTime = (Get-Item $posterFullPath).LastWriteTimeUtc
            if ($posterTime -ge $videoTime) {
              $needsPoster = $false
            }
          }

          if ($needsPoster) {
            $posterDir = [System.IO.Path]::GetDirectoryName($posterFullPath)
            if (-not (Test-Path $posterDir)) { New-Item -ItemType Directory -Path $posterDir | Out-Null }
            & ffmpeg -y -loglevel error -ss $timestamp -i $videoFullPath -frames:v 1 -vf "scale='min(1600,iw)':-2:force_original_aspect_ratio=decrease" -c:v libwebp -quality 82 -compression_level 6 $posterFullPath
            if ($LASTEXITCODE -ne 0) {
              throw "Failed to create poster for $videoFullPath"
            }
          }

          if (Test-Path $posterFullPath) {
            $posterMappings[$resolutionKey] = $posterRef
          }
        }
      }

      if (-not $posterMappings.ContainsKey($resolutionKey)) {
        return $tag
      }

      $isAutoplay = $tag -match '\sautoplay(\s|>)'
      $preloadValue = if ($isAutoplay) { 'metadata' } else { 'none' }
      $updated = [regex]::Replace($tag, '\sposter="[^"]*"', '', 'IgnoreCase')
      $updated = [regex]::Replace($updated, '\spreload="[^"]*"', '', 'IgnoreCase')
      $updated = [regex]::Replace($updated, '\sdata-managed-video="[^"]*"', '', 'IgnoreCase')

      $insert = " poster=`"$posterRef`" preload=`"$preloadValue`""
      if ($isAutoplay) {
        $insert += ' data-managed-video=`"autoplay`"'
      }

      $updated = $updated -replace '></video>$', "$insert></video>"
      return $updated
    },
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  )

  if ($content -ne $originalContent) {
    [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
    $updatedFiles += $file.FullName
  }
}

"Generated/verified posters: $($posterMappings.Count)"
"Updated html files: $($updatedFiles.Count)"
$posterMappings.GetEnumerator() | Sort-Object Name | ForEach-Object { "{0} -> {1}" -f $_.Key, $_.Value }
