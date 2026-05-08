@echo off
setlocal EnableExtensions
cd /d "%~dp0"
if not exist "%~dp0logs" mkdir "%~dp0logs"

set "REMOTE_1=U:\china-dashboard"
set "REMOTE_2=U:\Purchase\china-dashboard"
set "REMOTE_3=Q:\Purchase\china-dashboard"
set "REMOTE_DIRS=%REMOTE_1%;%REMOTE_2%;%REMOTE_3%"

for /f %%i in ('powershell.exe -NoProfile -Command "(Get-Date).ToString(\"yyyyMMdd\")"') do set "LOG_DATE=%%i"
set "LOG_FILE=%~dp0logs\%LOG_DATE%.log"

echo === KIRII fetch-data-silent start %DATE% %TIME% ===>> "%LOG_FILE%"
echo REMOTE_DIRS=%REMOTE_DIRS%>> "%LOG_FILE%"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0fetch-data.ps1" -RemoteDirs "%REMOTE_DIRS%" >> "%LOG_FILE%" 2>&1
set "PS_EXIT=%ERRORLEVEL%"
if not "%PS_EXIT%"=="0" (
  echo ERROR fetch-data.ps1 exit %PS_EXIT%>> "%LOG_FILE%"
)
echo === end exit %PS_EXIT% ===>> "%LOG_FILE%"
endlocal & exit /b %PS_EXIT%
