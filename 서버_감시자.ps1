# 알리고 갱신 서버 감시자 (Watchdog)
# Windows 작업 스케줄러에서 5분마다 실행 — 서버가 꺼져 있으면 자동 재시작

$port      = 7799
$folder    = "C:\Users\AligoCX\Documents\Claude\Projects\운영 지표 자동화"
$batFile   = Join-Path $folder "서버_백그라운드.bat"
$logFile   = Join-Path $folder "watchdog.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

function Write-Log($msg) {
    "$timestamp $msg" | Out-File -FilePath $logFile -Append -Encoding UTF8
}

# 포트 7799가 열려 있는지 확인
$listening = netstat -ano | Select-String ":$port\s.*LISTENING"

if ($listening) {
    Write-Log "[OK] 서버 정상 실행 중 (포트 $port)"
} else {
    Write-Log "[재시작] 서버가 꺼져 있음 → 재시작 시도"
    if (Test-Path $batFile) {
        Start-Process "cmd.exe" -ArgumentList "/c `"$batFile`"" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        $check = netstat -ano | Select-String ":$port\s.*LISTENING"
        if ($check) {
            Write-Log "[성공] 서버 재시작 완료"
        } else {
            Write-Log "[실패] 서버 재시작 후에도 포트 미확인 — 수동 확인 필요"
        }
    } else {
        Write-Log "[오류] 서버_백그라운드.bat 파일 없음: $batFile"
    }
}
