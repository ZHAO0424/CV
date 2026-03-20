$ErrorActionPreference = 'Stop'

$ff = "C:\Users\zzrsn\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin\ffmpeg.exe"
$fp = "C:\Users\zzrsn\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin\ffprobe.exe"

$src = Join-Path $PSScriptRoot "..\images\projects\UCL\Full_VR_Video_injected.mp4"
$out = Join-Path $PSScriptRoot "..\images\projects\UCL\Full_VR_Video_injected_1080p.mp4"

if (!(Test-Path $ff)) { throw "ffmpeg not found at: $ff" }
if (!(Test-Path $fp)) { throw "ffprobe not found at: $fp" }
if (!(Test-Path $src)) { throw "source video not found: $src" }

if (Test-Path $out) { Remove-Item -Force $out }

& $ff -y `
  -i $src `
  -map 0:v:0 -map 0:a? `
  -vf "scale=-2:1080:flags=lanczos" `
  -r 24 `
  -c:v libx264 -profile:v high -preset slow -crf 18 -maxrate 20M -bufsize 40M -pix_fmt yuv420p `
  -movflags +faststart `
  -c:a aac -b:a 192k -ac 2 `
  $out

& $fp -v error -show_entries format=size,duration:stream=width,height -of default=nw=1 $out
