$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSCommandPath
$manifest = Join-Path $root "MANIFEST_SHA256.txt"
$files = Get-ChildItem -LiteralPath $root -Recurse -File |
    Where-Object { $_.FullName -ne $manifest } |
    Sort-Object FullName
$lines = foreach ($file in $files) {
    $relative = $file.FullName.Substring($root.Length + 1) -replace '\\', '/'
    $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    "$hash  $relative"
}
Set-Content -LiteralPath $manifest -Value $lines -Encoding utf8
Write-Host "Manifiesto actualizado: $manifest"
Write-Host "Archivos registrados: $($lines.Count)"
