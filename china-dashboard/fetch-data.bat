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

for /f %%i in ('powershell.exe -NoProfile -Command "(Get-Date).ToString(\"yyyyMMdd\")"') do set "LOG_DATE=%%i"
set "LOG_FILE=%~dp0logs\%LOG_DATE%.log"
if not exist "%~dp0logs" mkdir "%~dp0logs"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0fetch-data.ps1" -RemoteDirs "%REMOTE_DIRS%" >> "%LOG_FILE%" 2>&1
set "PS_EXIT=%ERRORLEVEL%"
if not "%PS_EXIT%"=="0" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0notify-fetch-failure.ps1" -ExitCode %PS_EXIT% -LogFile "%LOG_FILE%"
)
echo Exit Code: %PS_EXIT%
pause
endlocal & exit /b %PS_EXIT%
