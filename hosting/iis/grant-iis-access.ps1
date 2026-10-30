# Run once, as Administrator, from the deployed site folder.
# Node fails with EPERM on C:\Users\Administrator\Documents because the
# IIS application pool cannot list that parent folder while resolving the app.
$ErrorActionPreference = "Stop"
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Error "Run this script from an Administrator PowerShell."
}

$app = Split-Path -Parent $PSCommandPath
$publish = Split-Path -Parent $app
$documents = Split-Path -Parent $publish
$profile = Split-Path -Parent $documents

icacls $profile /grant "IIS_IUSRS:(RX)"
icacls $documents /grant "IIS_IUSRS:(RX)"
icacls $publish /grant "IIS_IUSRS:(RX)"
icacls $app /grant "IIS_IUSRS:(OI)(CI)(M)"

Write-Host "Granted IIS_IUSRS access under $app"
& iisreset
