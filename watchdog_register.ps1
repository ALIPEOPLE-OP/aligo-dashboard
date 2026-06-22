# 알리고 갱신 서버 감시자 등록
# Windows 작업 스케줄러에 5분마다 실행 등록

$folder   = Split-Path -Parent $MyInvocation.MyCommand.Path
$ps1File  = Join-Path $folder '서버_감시자.ps1'
$taskName = 'Aligo_ServerWatchdog'

Write-Host ''
Write-Host '  === 알리고 갱신 서버 감시자 등록 ==='
Write-Host ''

if (-not (Test-Path $ps1File)) {
    Write-Host "  [X] 서버_감시자.ps1 파일을 찾을 수 없습니다: $ps1File"
    pause
    exit 1
}

$vbsFile   = Join-Path $folder '서버_감시자_숨김.vbs'
$action    = New-ScheduledTaskAction -Execute 'wscript.exe' `
               -Argument ('"' + $vbsFile + '"')
$trigger   = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 5) -Once -At (Get-Date)
$settings  = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 2) -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
        -Settings $settings -Principal $principal -Force | Out-Null
    Write-Host '  [OK] 등록 완료!'
    Write-Host '  5분마다 서버 상태 확인, 꺼져 있으면 자동 재시작합니다.'
    Write-Host ''
    # 지금 바로 서버도 시작
    $batFile = Join-Path $folder '서버_백그라운드.bat'
    if (Test-Path $batFile) {
        Start-Process 'cmd.exe' -ArgumentList ('/c "' + $batFile + '"') -WindowStyle Hidden
        Write-Host '  [OK] 서버도 바로 시작했습니다.'
    }
} catch {
    Write-Host "  [X] 등록 실패: $_"
}

Write-Host ''
pause