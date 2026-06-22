# Aligo daily metrics - register Windows Scheduled Task + run once now
# ASCII-only on purpose; uses $PSScriptRoot so the Korean folder path is never a literal.
$ErrorActionPreference = 'Stop'
$dir    = $PSScriptRoot
$script = Join-Path $dir 'daily-update.js'
$result = Join-Path $dir 'setup_result.txt'

function Save([string]$msg) { $msg | Out-File -FilePath $result -Encoding UTF8 -Append }
Set-Content -Path $result -Value ("[setup start] " + (Get-Date).ToString('s')) -Encoding UTF8

# locate node
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  foreach ($p in @('C:\Program Files\nodejs\node.exe','C:\Program Files (x86)\nodejs\node.exe')) {
    if (Test-Path $p) { $node = $p; break }
  }
}
if (-not $node)        { Save 'ERROR: node not found'; exit 1 }
if (-not (Test-Path $script)) { Save 'ERROR: daily-update.js not found'; exit 1 }
Save ("node=" + $node)

# register the scheduled task (daily 10:00, catch up if PC was off)
try {
  $action   = New-ScheduledTaskAction -Execute $node -Argument ('"' + $script + '"') -WorkingDirectory $dir
  $trigger  = New-ScheduledTaskTrigger -Daily -At 10:00am
  $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
  Register-ScheduledTask -TaskName 'AligoDailyMetrics' -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
  Save 'OK: scheduled task registered (AligoDailyMetrics, daily 10:00)'
} catch {
  Save ('ERROR registering task: ' + $_.Exception.Message)
}

# run an immediate update now
try {
  Save 'running daily-update.js now...'
  & $node $script 2>&1 | Out-Null
  Save 'OK: immediate update finished'
} catch {
  Save ('ERROR running update: ' + $_.Exception.Message)
}
Save ('[setup done] ' + (Get-Date).ToString('s'))
