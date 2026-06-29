@echo off
cd /d "%~dp0"
echo Stopping existing server on port 7799...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":7799 "') do taskkill /PID %%a /F >nul 2>&1
timeout /t 1 /nobreak >nul
echo Starting new server...
start "Aligo Update Server" cmd /k "node update-server.js"
timeout /t 2 /nobreak >nul
echo Done! Opening dashboard...
start "" "http://localhost:7799/"
