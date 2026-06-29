@echo off
chcp 65001 >nul
title 알리고 대시보드 실행 중...

:: Python 설치 확인
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ Python이 설치되어 있지 않습니다.
    echo    https://python.org 에서 설치 후 다시 실행해주세요.
    echo.
    pause
    exit /b
)

:: 포트 8080 사용 중이면 종료
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 " 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: 현재 폴더에서 Python 서버 시작 (백그라운드)
start /b python -m http.server 8080 --directory "%~dp0"

:: 잠시 대기
timeout /t 2 /nobreak >nul

:: Chrome 위치 자동 탐색 후 열기
set CHROME_PATH=
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

if defined CHROME_PATH (
    start "" %CHROME_PATH% "http://localhost:8080/알리고_대시보드.html"
) else (
    :: Chrome 못 찾으면 기본 브라우저로 열기
    start "" "http://localhost:8080/알리고_대시보드.html"
)

echo.
echo ✅ 대시보드가 열렸습니다.
echo    주소: http://localhost:8080/알리고_대시보드.html
echo.
echo 이 창을 닫으면 서버가 종료됩니다.
echo 대시보드 사용이 끝나면 이 창을 닫아주세요.
echo.
pause
