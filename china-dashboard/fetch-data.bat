@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "REMOTE_1=U:\china-dashboard"
set "REMOTE_2=U:\Purchase\china-dashboard"
set "REMOTE_3=Q:\Purchase\china-dashboard"
set "REMOTE_DIRS=%REMOTE_1%;%REMOTE_2%;%REMOTE_3%"

echo.
echo Sync targets (dashboard.html + chart.min.js):
echo   1) %REMOTE_1%
echo   2) %REMOTE_2%
echo   3) %REMOTE_3%
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0fetch-data.ps1" -RemoteDirs "%REMOTE_DIRS%"
set "PS_EXIT=%ERRORLEVEL%"
echo Exit Code: %PS_EXIT%
pause
endlocal & exit /b %PS_EXIT%
