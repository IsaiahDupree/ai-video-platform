# ORION render job runner for print-pack-launch-renderer.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File C:\render\print-pack-launch-renderer\orion\orion_render.ps1 -Job <name>
# Expects C:\render\jobs\<name>\{props.json, job.json}; writes <name>.mp4 + receipt.json.
# Modeled on silent-explainer/orion/orion_render.ps1 (same flags and receipt shape).
param([Parameter(Mandatory=$true)][string]$Job)
$ErrorActionPreference = "Stop"
$root = "C:\render\print-pack-launch-renderer"
$dir  = "C:\render\jobs\$Job"
# PowerShell variables are case-insensitive: never name one $job (clobbers -Job).
$meta = Get-Content "$dir\job.json" | ConvertFrom-Json
$comp = $meta.composition
$out  = "$dir\$Job.mp4"
$browser = Join-Path ${env:ProgramFiles} "Google\Chrome\Application\chrome.exe"
$t0 = Get-Date
Set-Location $root
$ErrorActionPreference = "Continue"
& npx remotion render src/index.tsx $comp $out --props "$dir\props.json" `
    --browser-executable="$browser" --codec=h264 --pixel-format=yuv420p --crf=18 `
    --concurrency=4 --gl=angle --log=warn 2>&1 | Tee-Object -FilePath "$dir\render.log" | Out-Null
$ErrorActionPreference = "Stop"
if (-not (Test-Path $out)) { Get-Content "$dir\render.log" | Select-Object -Last 30; throw "render produced no file" }
$sha = (Get-FileHash $out -Algorithm SHA256).Hash.ToLower()
$psha = (Get-FileHash "$dir\props.json" -Algorithm SHA256).Hash.ToLower()
$gpu = (Get-CimInstance Win32_VideoController | Where-Object Name -like "*NVIDIA*" | Select-Object -First 1 -ExpandProperty Name)
$receipt = [ordered]@{
  lane = "orion"; host = $env:COMPUTERNAME; gpu = $gpu; composition = $comp; job = $Job
  remotion = "4.0.434"; browser = (Get-Item $browser).VersionInfo.ProductVersion
  props_sha256 = $psha; output_sha256 = $sha; bytes = (Get-Item $out).Length
  render_time_sec = [math]::Round(((Get-Date) - $t0).TotalSeconds, 1)
  rendered_at = (Get-Date -Format o)
}
$receipt | ConvertTo-Json | Set-Content "$dir\receipt.json"
"RENDER_OK $sha"
