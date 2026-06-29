@echo off
chcp 65001 >nul
title 알리고 대시보드 실행 중...

:: 포트 8080 사용 중이면 종료
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 " 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Node.js 서버 시작
wscript /nologo "%~dp0start_http_server.vbs"

:: 잠시 대기
timeout /t 2 /nobreak >nul

:: Chrome으로 대시보드 열기
set CHROME_PATH=
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

if defined CHROME_PATH (
    start "" %CHROME_PATH% "http://localhost:8080/알리고_대시보드.html"
) else (
    start "" "http://localhost:8080/알리고_대시보드.html"
)

echo.
echo ✅ 대시보드가 열렸습니다.
echo    주소: http://localhost:8080/알리고_대시보드.html
echo.
