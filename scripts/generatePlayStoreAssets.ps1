# Generates Google Play listing graphics from assets/icon.png.
# Requires Windows PowerShell with System.Drawing.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$srcIcon = Join-Path $root 'assets\icon.png'
$outDir = Join-Path $root 'play-store\assets'

if (-not (Test-Path $srcIcon)) {
  Write-Error "Missing source icon: $srcIcon"
}

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
Add-Type -AssemblyName System.Drawing

function Save-Bitmap($bitmap, $path) {
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
  Write-Host "Wrote $path"
}

# 512x512 high-res icon (Play Store listing)
$src = [System.Drawing.Image]::FromFile($srcIcon)
$icon512 = New-Object System.Drawing.Bitmap 512, 512
$g = [System.Drawing.Graphics]::FromImage($icon512)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, 0, 0, 512, 512)
$g.Dispose()
$src.Dispose()
Save-Bitmap $icon512 (Join-Path $outDir 'icon-512.png')

# 1024x500 feature graphic (black background, centered logo)
$fgW = 1024
$fgH = 500
$fg = New-Object System.Drawing.Bitmap $fgW, $fgH
$g2 = [System.Drawing.Graphics]::FromImage($fg)
$g2.Clear([System.Drawing.Color]::FromArgb(0, 0, 0))
$logo = [System.Drawing.Image]::FromFile($srcIcon)
$logoSize = 360
$x = [int](($fgW - $logoSize) / 2)
$y = [int](($fgH - $logoSize) / 2)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g2.DrawImage($logo, $x, $y, $logoSize, $logoSize)
$logo.Dispose()
$g2.Dispose()
Save-Bitmap $fg (Join-Path $outDir 'feature-graphic.png')

Write-Host 'Done. Upload play-store/assets/*.png in Play Console > Main store listing.'
