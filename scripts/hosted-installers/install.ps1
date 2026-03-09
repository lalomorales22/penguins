[CmdletBinding()]
param(
  [string]$RepoUrl = $(if ($env:PENGUINS_GIT_REPO) { $env:PENGUINS_GIT_REPO } else { "https://github.com/penguins/penguins.git" }),
  [string]$Branch = $(if ($env:PENGUINS_GIT_BRANCH) { $env:PENGUINS_GIT_BRANCH } else { "main" }),
  [string]$GitDir = $(if ($env:PENGUINS_GIT_DIR) { $env:PENGUINS_GIT_DIR } else { (Join-Path $HOME "penguins") }),
  [string]$BinDir = $(if ($env:PENGUINS_BIN_DIR) { $env:PENGUINS_BIN_DIR } else { (Join-Path $HOME ".local\bin") }),
  [switch]$NoGitUpdate,
  [switch]$NoOnboard,
  [switch]$DryRun,
  [switch]$Help
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$PnpmVersion = "10.23.0"

function Show-Usage {
  @"
Temporary Penguins git installer

This script clones Penguins from GitHub, builds it locally, and writes wrappers
to %USERPROFILE%\.local\bin by default. It is meant for self-hosted testing on
your own HTTPS domain before npm publish exists.

Usage:
  iwr -useb https://your-domain.example/install.ps1 | iex
  & ([scriptblock]::Create((iwr -useb https://your-domain.example/install.ps1))) -NoOnboard

Options:
  -RepoUrl <url>      Git repository to clone
  -Branch <name>      Git branch to clone/update
  -GitDir <path>      Checkout directory
  -BinDir <path>      Wrapper install directory
  -NoGitUpdate        Skip git pull for an existing checkout
  -NoOnboard          Skip onboarding
  -DryRun             Print actions without applying changes
  -Help               Show this help

Environment variables:
  PENGUINS_GIT_REPO
  PENGUINS_GIT_BRANCH
  PENGUINS_GIT_DIR
  PENGUINS_BIN_DIR
  PENGUINS_GIT_UPDATE=0
  PENGUINS_NO_ONBOARD=1
  PENGUINS_DRY_RUN=1

Requirements:
  - Git
  - Node.js 22.12+
"@
}

if ($Help) {
  Show-Usage
  exit 0
}

if ($env:PENGUINS_GIT_UPDATE -eq "0") {
  $NoGitUpdate = $true
}

if ($env:PENGUINS_NO_ONBOARD -eq "1") {
  $NoOnboard = $true
}

if ($env:PENGUINS_DRY_RUN -eq "1") {
  $DryRun = $true
}

function Write-Step([string]$Message) {
  Write-Host "==> $Message"
}

function Fail([string]$Message) {
  throw $Message
}

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Fail "missing required command: $Name"
  }
}

function Invoke-External([string]$FilePath, [string[]]$Arguments) {
  $rendered = @($FilePath) + $Arguments
  if ($DryRun) {
    Write-Host "+ $($rendered -join ' ')"
    return
  }

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "command failed: $($rendered -join ' ')"
  }
}

function Test-NodeVersion {
  $versionText = (& node -p "process.versions.node").Trim()
  $version = [version]$versionText
  if ($version.Major -lt 22 -or ($version.Major -eq 22 -and $version.Minor -lt 12)) {
    Fail "Node.js 22.12+ is required; found $versionText"
  }
}

function Resolve-PnpmRunner {
  if (Get-Command "corepack" -ErrorAction SilentlyContinue) {
    return @{
      FilePath = "corepack"
      Prefix = @("pnpm")
    }
  }

  if (Get-Command "pnpm" -ErrorAction SilentlyContinue) {
    return @{
      FilePath = "pnpm"
      Prefix = @()
    }
  }

  if (Get-Command "npx" -ErrorAction SilentlyContinue) {
    return @{
      FilePath = "npx"
      Prefix = @("--yes", "pnpm@$PnpmVersion")
    }
  }

  Fail "missing pnpm runner: install corepack, pnpm, or npm/npx"
}

function Invoke-Pnpm([hashtable]$Runner, [string[]]$Arguments) {
  $allArgs = @($Runner.Prefix + "--dir" + $GitDir + $Arguments)
  Invoke-External $Runner.FilePath $allArgs
}

function Ensure-UserPath([string]$TargetDir) {
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $parts = @()
  if ($userPath) {
    $parts = $userPath.Split(';', [System.StringSplitOptions]::RemoveEmptyEntries)
  }

  if ($parts -contains $TargetDir) {
    return
  }

  if ($DryRun) {
    Write-Host "==> Would add $TargetDir to the user PATH"
    return
  }

  $newParts = @($parts + $TargetDir)
  [Environment]::SetEnvironmentVariable("Path", ($newParts -join ';'), "User")
  if ($env:Path) {
    $env:Path = "$TargetDir;$env:Path"
  } else {
    $env:Path = $TargetDir
  }
}

function Write-Wrappers([string]$RepoDir, [string]$TargetDir) {
  $cmdPath = Join-Path $TargetDir "penguins.cmd"
  $ps1Path = Join-Path $TargetDir "penguins.ps1"
  $entryPath = Join-Path $RepoDir "penguins.mjs"

  if ($DryRun) {
    Write-Host "==> Would write wrappers to $TargetDir"
    return $cmdPath
  }

  New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

  $cmdBody = @(
    "@echo off",
    "node ""$entryPath"" %*"
  ) -join "`r`n"
  [System.IO.File]::WriteAllText($cmdPath, $cmdBody + "`r`n")

  $ps1Body = @(
    "& node ""$entryPath"" @args",
    "exit `$LASTEXITCODE"
  ) -join "`r`n"
  [System.IO.File]::WriteAllText($ps1Path, $ps1Body + "`r`n")

  return $cmdPath
}

Require-Command "git"
Require-Command "node"
Test-NodeVersion
$pnpmRunner = Resolve-PnpmRunner

$env:SHARP_IGNORE_GLOBAL_LIBVIPS = if ($env:SHARP_IGNORE_GLOBAL_LIBVIPS) {
  $env:SHARP_IGNORE_GLOBAL_LIBVIPS
} else {
  "1"
}

if ((Test-Path $GitDir) -and -not (Test-Path (Join-Path $GitDir ".git"))) {
  Fail "checkout directory exists but is not a git repo: $GitDir"
}

if (-not (Test-Path (Join-Path $GitDir ".git"))) {
  Write-Step "Cloning Penguins into $GitDir"
  Invoke-External "git" @("clone", "--branch", $Branch, "--single-branch", $RepoUrl, $GitDir)
} else {
  Write-Step "Using existing checkout at $GitDir"
  Invoke-External "git" @("-C", $GitDir, "checkout", $Branch)
  if (-not $NoGitUpdate) {
    Invoke-External "git" @("-C", $GitDir, "fetch", "origin", $Branch)
    Invoke-External "git" @("-C", $GitDir, "pull", "--ff-only", "origin", $Branch)
  }
}

Write-Step "Installing dependencies"
Invoke-Pnpm $pnpmRunner @("install", "--frozen-lockfile")

Write-Step "Building browser UI"
Invoke-Pnpm $pnpmRunner @("ui:build")

Write-Step "Building Penguins"
Invoke-Pnpm $pnpmRunner @("build")

Write-Step "Writing penguins wrappers"
$cmdWrapper = Write-Wrappers -RepoDir $GitDir -TargetDir $BinDir
Ensure-UserPath -TargetDir $BinDir

if (-not $DryRun) {
  try {
    & $cmdWrapper "doctor" "--non-interactive" *> $null
  } catch {
  }
}

if (-not $NoOnboard) {
  Write-Step "Running onboarding"
  if ($DryRun) {
    Write-Host "+ $cmdWrapper onboard --install-daemon"
  } else {
    & $cmdWrapper "onboard" "--install-daemon"
    if ($LASTEXITCODE -ne 0) {
      throw "command failed: $cmdWrapper onboard --install-daemon"
    }
  }
} else {
  Write-Step "Skipping onboarding"
}

Write-Step "Penguins is installed from git at $GitDir"
Write-Step "Wrapper path: $cmdWrapper"
Write-Host "Open a new terminal if `penguins` is not found in this PowerShell session."
