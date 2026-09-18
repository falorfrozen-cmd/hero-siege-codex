$ErrorActionPreference = 'Stop'
$desktopRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$siteRoot = [IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $desktopRoot) 'HSItemCodex'))
$snapshotRoot = [IO.Path]::GetFullPath((Join-Path $desktopRoot 'web'))
if ($snapshotRoot -ne (Join-Path $desktopRoot 'web')) { throw 'Unexpected snapshot target.' }
foreach ($name in @('app', 'components', 'hooks', 'lib', 'public')) {
  $source = Join-Path $siteRoot $name
  $target = Join-Path $snapshotRoot $name
  if (!(Test-Path -LiteralPath $source -PathType Container)) { throw "Missing source: $source" }
  New-Item -ItemType Directory -Path $target -Force | Out-Null
  Get-ChildItem -LiteralPath $source -Force | Copy-Item -Destination $target -Recurse -Force
  # Remove only stale files inside the selected snapshot directory. Git retains v0.2.0.
  $prefix = [IO.Path]::GetFullPath($target) + [IO.Path]::DirectorySeparatorChar
  Get-ChildItem -LiteralPath $target -Recurse -File -Force | ForEach-Object {
    $file = [IO.Path]::GetFullPath($_.FullName)
    if (!$file.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'Snapshot path escaped its root.' }
    $relative = $file.Substring($prefix.Length)
    if (!(Test-Path -LiteralPath (Join-Path $source $relative))) { Remove-Item -LiteralPath $file }
  }
}
& node (Join-Path $PSScriptRoot 'adapt-website.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Desktop adaptations failed.' }
$commit = & git -C $siteRoot rev-parse --verify HEAD
if ($LASTEXITCODE -ne 0) { throw 'Cannot identify website source.' }
@{sourceCommit=$commit;copiedDirectories=@('app','components','hooks','lib','public');note='Offline snapshot of the identified source commit. Sharing links and route adapters are desktop-specific; no hosting credentials or authentication files included.'} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $desktopRoot 'web-source.json') -Encoding utf8
