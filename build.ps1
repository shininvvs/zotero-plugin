# Packages the plugin into build/hangul-cite.xpi
# Usage:  powershell -ExecutionPolicy Bypass -File build.ps1

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = $PSScriptRoot
$out  = Join-Path $root 'build'
$xpi  = Join-Path $out 'hangul-cite.xpi'

if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Path $out | Out-Null

$items = @()
$items += Get-Item (Join-Path $root 'manifest.json')
$items += Get-Item (Join-Path $root 'bootstrap.js')
$items += Get-ChildItem (Join-Path $root 'src') -Recurse -File

# Entry names are built by hand with forward slashes. Compress-Archive on Windows
# PowerShell 5.1 writes backslashes, which Zotero fails to resolve at load time.
$archive = [System.IO.Compression.ZipFile]::Open($xpi, 'Create')
try {
    foreach ($item in $items) {
        $entry = $item.FullName.Substring($root.Length + 1).Replace('\', '/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $archive, $item.FullName, $entry) | Out-Null
        Write-Host "  + $entry"
    }
}
finally {
    $archive.Dispose()
}

$size = [math]::Round((Get-Item $xpi).Length / 1KB, 1)
Write-Host "built: $xpi ($size KB)"
