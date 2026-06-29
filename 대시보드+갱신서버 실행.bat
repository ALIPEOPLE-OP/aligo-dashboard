@echo off
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found. Install from https://nodejs.org
  pause
  exit /b 1
)

netstat -ano | findstr ":7799 " >nul 2>&1
if not errorlevel 1 (
  echo Server already running on port 7799.
) else (
  echo Starting server...
  start "Aligo Update Server" cmd /k "node update-server.js"
  timeout /t 2 /nobreak >nul
)

start "" "index.html"
