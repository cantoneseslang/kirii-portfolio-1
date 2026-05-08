@echo off
REM Wrapper: same as fetch-data.bat (kept for old shortcuts / Task Scheduler names).
setlocal EnableExtensions
cd /d "%~dp0"
call "%~dp0fetch-data.bat"
endlocal & exit /b %ERRORLEVEL%
