$root = Resolve-Path "..\..\"
$srcLogo = Join-Path $root 'logo'
$srcPublic = Join-Path $root 'public'
$dest = Join-Path (Resolve-Path '.') 'assets'

if (-Not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }

if (Test-Path $srcLogo) { Copy-Item -Path (Join-Path $srcLogo '*') -Destination $dest -Recurse -Force }
if (Test-Path $srcPublic) { Copy-Item -Path (Join-Path $srcPublic '*') -Destination $dest -Recurse -Force }

Write-Host "Assets copied to" $dest
