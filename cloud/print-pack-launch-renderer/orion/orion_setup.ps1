# ORION setup for print-pack-launch-renderer.
# Usage (from the ssh home dir, after scp of the tarball + this script):
#   powershell -NoProfile -ExecutionPolicy Bypass -File print_pack_setup.ps1 -Job print-pack-launch-vertical
# Extracts the package into C:\render, runs npm ci only when the lockfile changed,
# and stages C:\render\jobs\<Job>\{props.json, job.json} for orion_render.ps1.
param([Parameter(Mandatory=$true)][string]$Job)
$ErrorActionPreference = "Stop"
$root = "C:\render\print-pack-launch-renderer"
New-Item -ItemType Directory -Force -Path C:\render | Out-Null
if (Test-Path $root) {
  Remove-Item -Recurse -Force "$root\src", "$root\public", "$root\orion" -ErrorAction SilentlyContinue
}
tar -xzf "$env:USERPROFILE\print-pack-launch-renderer.tgz" -C C:\render
Set-Location $root
$lockSha = (Get-FileHash "$root\package-lock.json" -Algorithm SHA256).Hash
$stamp = "$root\.lock-installed"
$prev = if (Test-Path $stamp) { (Get-Content $stamp -Raw).Trim() } else { "" }
if (($prev -ne $lockSha) -or -not (Test-Path "$root\node_modules\remotion")) {
  "npm ci start " + (Get-Date -Format s)
  npm ci --no-audit --no-fund 2>&1 | Select-Object -Last 3
  if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
  Set-Content -Path $stamp -Value $lockSha
  "npm ci done " + (Get-Date -Format s)
} else {
  "npm ci skipped (lockfile unchanged)"
}
"remotion: " + (npx remotion --version 2>&1 | Select-Object -Last 1)
$jobDir = "C:\render\jobs\$Job"
New-Item -ItemType Directory -Force -Path $jobDir | Out-Null
Copy-Item "$root\src\props.json" "$jobDir\props.json" -Force
Copy-Item "$root\orion\job\job.json" "$jobDir\job.json" -Force
Remove-Item "$jobDir\$Job.mp4", "$jobDir\receipt.json" -ErrorAction SilentlyContinue
"setup ok $jobDir"
