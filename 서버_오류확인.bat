@echo off
cd /d "%~dp0"
echo Running server and saving log...
node update-server.js > server_error.txt 2>&1
echo.
echo Server stopped. Check server_error.txt for details.
pause
