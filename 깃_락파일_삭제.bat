@echo off
echo Git Lock File Remover
echo.
taskkill /F /IM "GitHubDesktop.exe" >nul 2>&1
echo GitHub Desktop closed.
timeout /t 2 >nul
set FOUND=0
if exist "%USERPROFILE%\Documents\GitHub" (
  for /d %%G in ("%USERPROFILE%\Documents\GitHub\*") do (
    if exist "%%G\.git\index.lock" (
      del /f "%%G\.git\index.lock"
      echo Deleted: %%G\.git\index.lock
      set FOUND=1
    )
  )
)
if %FOUND%==1 (
  echo DONE! Now open GitHub Desktop and try Push again.
) else (
  echo Lock file not found in Documents/GitHub folder.
  echo Please tell me your repo folder path.
)
echo.
pause
