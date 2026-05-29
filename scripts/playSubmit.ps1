# Upload latest production AAB to Play internal testing (draft).
# Prerequisite: enable Android Publisher API once (project Owner):
#   https://console.developers.google.com/apis/api/androidpublisher.googleapis.com/overview?project=827570597255
# Also grant this service account in Play Console → Setup → API access (Financial data).

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$envFile = Join-Path $PWD "firebase\functions\.env"
$outFile = Join-Path $PWD ".eas-play-service-account.json"
if (-not (Test-Path $outFile)) {
  if (-not (Test-Path $envFile)) { throw "Missing $envFile" }
  $raw = Get-Content $envFile -Raw
  if ($raw -notmatch '(?ms)^GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=(.+)$') {
    throw "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON not found in $envFile"
  }
  $json = $Matches[1].Trim()
  if ($json.StartsWith('"') -and $json.EndsWith('"')) { $json = $json.Substring(1, $json.Length - 2) }
  [System.IO.File]::WriteAllText($outFile, $json)
}

Write-Host "Checking Android Publisher API..."
node -e @"
const fs=require('fs');
const {google}=require('./firebase/functions/node_modules/googleapis');
const key=JSON.parse(fs.readFileSync('.eas-play-service-account.json','utf8'));
const auth=new google.auth.GoogleAuth({credentials:key,scopes:['https://www.googleapis.com/auth/androidpublisher']});
google.androidpublisher({version:'v3',auth}).edits.insert({packageName:'com.jorgeitglobalsolutionssorganization.emfitsystem'})
  .then(()=>{console.log('API_OK');process.exit(0)})
  .catch(e=>{console.error('API_ERR:',e.message);process.exit(1)});
"@
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Enable the API in Google Cloud Console (Owner login), wait ~2 min, then re-run:"
  Write-Host "  .\scripts\playSubmit.ps1"
  exit 1
}

$buildId = $args[0]
$submitArgs = @("submit", "--platform", "android", "--profile", "production", "--non-interactive", "--wait")
if ($buildId) { $submitArgs += @("--id", $buildId) } else { $submitArgs += "--latest" }

Write-Host "Submitting to Play internal track..."
if (Test-Path (Join-Path $PWD "scripts\uploadAabToPlayInternal.cjs")) {
  $aab = Get-ChildItem -Path $PWD -Filter "*.aab" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($aab) {
    node (Join-Path $PWD "scripts\uploadAabToPlayInternal.cjs") $aab.FullName
    exit $LASTEXITCODE
  }
}

npx eas-cli @submitArgs
exit $LASTEXITCODE
