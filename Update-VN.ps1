param([string]$ZipPath = "")
$ErrorActionPreference = 'Stop'
try {
  # GitHub Desktop bundles Git even when git.exe is not on the Windows PATH.
  $gitCommand = Get-Command git.exe -ErrorAction SilentlyContinue
  if ($gitCommand) {
    $gitExe = $gitCommand.Source
  } else {
    $candidates = @(
      (Join-Path $env:ProgramFiles 'Git\cmd\git.exe'),
      (Join-Path $env:ProgramFiles 'Git\bin\git.exe'),
      (Join-Path ${env:ProgramFiles(x86)} 'Git\cmd\git.exe'),
      (Join-Path $env:LOCALAPPDATA 'Programs\Git\cmd\git.exe')
    ) | Where-Object { $_ -and (Test-Path -LiteralPath $_ -PathType Leaf) }
    $desktopRoot = Join-Path $env:LOCALAPPDATA 'GitHubDesktop'
    if (Test-Path -LiteralPath $desktopRoot) {
      $candidates += @(Get-ChildItem -LiteralPath $desktopRoot -Directory -Filter 'app-*' -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending | ForEach-Object {
          Join-Path $_.FullName 'resources\app\git\cmd\git.exe'
          Join-Path $_.FullName 'resources\app\git\mingw64\bin\git.exe'
        } | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf })
    }
    $gitExe = @($candidates | Select-Object -First 1)[0]
  }
  if (-not $gitExe) { throw 'Git not found. Please send a screenshot; no files were changed.' }
  Write-Host "Using Git: $gitExe"
  $repo = (& $gitExe -C $PSScriptRoot rev-parse --show-toplevel 2>$null).Trim()
  if (-not $repo) { throw 'Place these scripts in the root of your local Git repository.' }
  if ((Resolve-Path $repo).Path -ne (Resolve-Path $PSScriptRoot).Path) { throw 'Scripts must be in the repository root.' }
  $branch = (& $gitExe -C $repo branch --show-current).Trim()
  if ($branch -ne 'test-vn-ci') { throw "Current branch is '$branch'. Switch to test-vn-ci before running." }
  $dirty = @(& $gitExe -C $repo status --porcelain)
  if ($dirty.Count -gt 0) { throw 'Uncommitted changes exist. Commit/stash them before running.' }
  if (-not $ZipPath) { $ZipPath = Read-Host 'Enter the full path of the new VN ZIP file (drag ZIP here)' }
  $ZipPath = $ZipPath.Trim(' ','"',"'")
  if (-not (Test-Path -LiteralPath $ZipPath -PathType Leaf)) { throw "ZIP not found: $ZipPath" }
  $tmp = Join-Path ([IO.Path]::GetTempPath()) ('vn-update-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $tmp | Out-Null
  try {
    Add-Type -AssemblyName System.IO.Compression
    $archive = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $ZipPath).Path)
    try {
      foreach ($entry in $archive.Entries) {
        $name = $entry.FullName.Replace('\\','/')
        if ($name.StartsWith('/') -or $name -match '(^|/)\.\.(/|$)' -or $name -match '^[A-Za-z]:') { throw "Unsafe ZIP path: $name" }
      }
    } finally { $archive.Dispose() }
    Expand-Archive -LiteralPath $ZipPath -DestinationPath $tmp -Force
    $root = $tmp
    $children = @(Get-ChildItem -LiteralPath $tmp)
    if ($children.Count -eq 1 -and $children[0].PSIsContainer -and -not (Test-Path (Join-Path $tmp 'index.html'))) { $root = $children[0].FullName }
    if (-not (Test-Path (Join-Path $root 'index.html'))) { throw 'ZIP does not contain index.html at expected root; stopped.' }
    $files = @(Get-ChildItem -LiteralPath $root -File -Recurse | Where-Object { $_.FullName.Substring($root.Length).TrimStart('\\','/') -notmatch '^(\.git|\.github)([\\/]|$)' })
    if ($files.Count -lt 30) { throw "Only $($files.Count) files in ZIP. Refusing potentially incomplete update." }
    $changed = 0; $unchanged = 0
    foreach ($f in $files) {
      $rel = $f.FullName.Substring($root.Length).TrimStart('\\','/')
      $dest = Join-Path $repo $rel
      if (Test-Path -LiteralPath $dest) {
        if ((Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash -eq (Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash) { $unchanged++; continue }
      }
      $parent = Split-Path -Parent $dest
      if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
      Copy-Item -LiteralPath $f.FullName -Destination $dest -Force
      $changed++
    }
    Write-Host "Done. Branch: $branch. Updated: $changed. Unchanged: $unchanged. No files deleted." -ForegroundColor Green
    Write-Host 'Review Changes in GitHub Desktop, then Commit and Push. This script does NOT deploy.'
  } finally { Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue }
} catch { Write-Host "STOPPED: $($_.Exception.Message)" -ForegroundColor Red; exit 1 }
