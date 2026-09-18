$ErrorActionPreference = 'Stop'
$codexProject = Split-Path -Parent $PSScriptRoot
$codexVersion = (Get-Content -LiteralPath (Join-Path $codexProject 'package.json') -Raw | ConvertFrom-Json).version
$codexRelease = Join-Path $codexProject "release/$codexVersion"
$codexSetupFolder = Join-Path $codexRelease 'Windows-x64-Setup'
$codexPortableFolder = Join-Path $codexRelease 'Windows-x64-Portable'
New-Item -ItemType Directory -Path $codexSetupFolder,$codexPortableFolder -Force | Out-Null
$codexSetup = Join-Path $codexSetupFolder "HeroSiegeItemCodex-$codexVersion-Setup.exe"
Copy-Item -LiteralPath (Join-Path $codexProject "src-tauri/target/release/bundle/nsis/Hero Siege Item Codex_$($codexVersion)_x64-setup.exe") -Destination $codexSetup
Copy-Item -LiteralPath (Join-Path $codexProject 'src-tauri/target/release/hero-siege-item-codex.exe') -Destination (Join-Path $codexPortableFolder 'hero-siege-item-codex.exe')
foreach ($codexFolder in @($codexSetupFolder, $codexPortableFolder)) {
  Copy-Item -LiteralPath (Join-Path $codexProject 'README.md') -Destination (Join-Path $codexFolder 'README.md')
  Copy-Item -LiteralPath (Join-Path $codexProject 'web-source.json') -Destination (Join-Path $codexFolder 'web-source.json')
  Copy-Item -LiteralPath (Join-Path $codexProject 'distribution/TEST_RESULTS.md') -Destination (Join-Path $codexFolder 'TEST_RESULTS.md')
  Copy-Item -LiteralPath (Join-Path $codexProject 'distribution/THIRD_PARTY_NOTICES.txt') -Destination (Join-Path $codexFolder 'THIRD_PARTY_NOTICES.txt')
  $codexHashes = Get-ChildItem -LiteralPath $codexFolder -File | Where-Object Name -ne 'SHA256SUMS.txt' | Sort-Object Name | ForEach-Object {
    $codexHash = Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256
    "$($codexHash.Hash.ToLower())  $($_.Name)"
  }
  $codexHashes | Set-Content -LiteralPath (Join-Path $codexFolder 'SHA256SUMS.txt') -Encoding ascii
}
Compress-Archive -LiteralPath (Get-ChildItem -LiteralPath $codexSetupFolder -File).FullName -DestinationPath (Join-Path $codexRelease "HeroSiegeItemCodex-$codexVersion-Windows-x64-TEST.zip") -CompressionLevel Optimal -Force
Compress-Archive -LiteralPath (Get-ChildItem -LiteralPath $codexPortableFolder -File).FullName -DestinationPath (Join-Path $codexRelease "HeroSiegeItemCodex-$codexVersion-Windows-x64-Portable.zip") -CompressionLevel Optimal -Force
Get-ChildItem -LiteralPath $codexRelease -Filter '*.zip' | ForEach-Object {
  $codexHash = Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256
  "$($codexHash.Hash.ToLower())  $($_.Name)"
} | Set-Content -LiteralPath (Join-Path $codexRelease 'SHA256SUMS.txt') -Encoding ascii
Get-ChildItem -LiteralPath $codexRelease -Filter '*.zip' | Select-Object Name,Length
