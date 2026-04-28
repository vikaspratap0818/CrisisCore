$src  = "C:\Users\lenovo\OneDrive\Desktop\Solution Challenege Project\assets\logos.png"
$dest = "C:\Users\lenovo\OneDrive\Desktop\Solution Challenege Project\client\public\assets\logos.png"
$dir  = Split-Path $dest

if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }

if (Test-Path $src) {
    Copy-Item $src -Destination $dest -Force
    Write-Host "SUCCESS: logos.png copied to client/public/assets/" -ForegroundColor Green
} else {
    Write-Host "ERROR: Source file not found: $src" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
