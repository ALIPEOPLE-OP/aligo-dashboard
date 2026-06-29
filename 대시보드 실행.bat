@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo.
echo  ================================
echo   알리고 운영 지표 대시보드 시작
echo  ================================
echo.

:: ── 갱신 서버(7799) 자동 시작 ──────────────────────────
where node >nul 2>&1
if %errorlevel% == 0 (
  netstat -ano | findstr ":7799 " >nul 2>&1
  if errorlevel 1 (
    echo  ▶ 갱신 서버 시작 중...
    start "알리고 갱신서버" /min cmd /c "node update-server.js"
    timeout /t 2 /nobreak >nul
    echo  ✅ 갱신 서버 시작 완료 (백그라운드)
  ) else (
    echo  ✅ 갱신 서버 이미 실행 중
  )
) else (
  echo  ⚠️  Node.js 미설치 — 갱신 서버 없이 실행합니다.
)
echo.

echo  브라우저가 자동으로 열립니다.
echo  이 검정 창은 닫지 마세요!
echo  (닫으면 데이터 연결이 끊깁니다)
echo.

:: ── 로컬 웹 서버 + 브라우저 오픈 ────────────────────────
where node >nul 2>&1
if %errorlevel% == 0 (
    timeout /t 1 /nobreak > nul
    start "" "http://localhost:8765"
    npx --yes serve . --listen 8765 --no-clipboard
    goto end
)

:: Python3 폴백
where python >nul 2>&1
if %errorlevel% == 0 (
    timeout /t 1 /nobreak > nul
    start "" "http://localhost:8765/index.html"
    python -m http.server 8765
    goto end
)

where py >nul 2>&1
if %errorlevel% == 0 (
    timeout /t 1 /nobreak > nul
    start "" "http://localhost:8765/index.html"
    py -m http.server 8765
    goto end
)

:: 위 둘 다 없으면 안내
echo  [오류] Node.js 또는 Python이 설치되어 있지 않습니다.
echo.
echo  아래 중 하나를 설치 후 다시 실행하세요:
echo  - Node.js: https://nodejs.org
echo  - Python : https://python.org
echo.
pause
:end
