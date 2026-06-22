# Register save-server to auto-start at logon, and remove the broken node-based task.
$ErrorActionPreference = 'SilentlyContinue'
$dir = $PSScriptRoot
$result = Join-Path $dir 'setup_result.txt'
Set-Content -Path $result -Value ("[save-server setup] " + (Get-Date).ToString('s')) -Encoding UTF8

# 1) remove the old node task that cannot authenticate to GAS
Unregister-ScheduledTask -TaskName 'AligoDailyMetrics' -Confirm:$false
Add-Content $result 'removed AligoDailyMetrics (node task)'

# 2) register save-server (hidden) to run at logon
$vbs = Join-Path $dir 'start_save_server.vbs'
$action   = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('"' + $vbs + '"') -WorkingDirectory $dir
$trigger  = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
try {
  Register-ScheduledTask -TaskName 'AligoSaveServer' -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
  Add-Content $result 'OK: AligoSaveServer registered (runs at logon, hidden)'
} catch {
  Add-Content $result ('ERROR registering AligoSaveServer: ' + $_.Exception.Message)
}

# 3) make sure it is running right now (ignore if already up on 7799)
try { Start-Process wscript.exe -ArgumentList ('"' + $vbs + '"') -WorkingDirectory $dir } catch {}
Add-Content $result ('[done] ' + (Get-Date).ToString('s'))
