@echo off
REM KIRII Dashboard - Register scheduled task (Mon-Fri 08:55, 12:55, 16:55)
REM Run this once as Administrator on the Hong Kong PC

set "TASK_NAME=KIRII Dashboard Update"
set "BAT_PATH=%~dp0fetch-data-silent.bat"

REM Delete existing task if any
schtasks /Delete /TN "%TASK_NAME%" /F >nul 2>&1

REM Create task with first trigger (08:55 Mon-Fri)
schtasks /Create /TN "%TASK_NAME%" /TR "\"%BAT_PATH%\"" /SC WEEKLY /D MON,TUE,WED,THU,FRI /ST 08:55 /F

REM Add second trigger (12:55) and third trigger (16:55) via XML import
REM schtasks cannot add multiple triggers directly, so we export, patch, and re-import

set "XML_PATH=%~dp0task-schedule.xml"

powershell -ExecutionPolicy Bypass -Command ^
  "$xml = [xml](schtasks /Query /TN '%TASK_NAME%' /XML);" ^
  "$ns = New-Object Xml.XmlNamespaceManager($xml.NameTable);" ^
  "$ns.AddNamespace('t','http://schemas.microsoft.com/windows/2004/02/mit/task');" ^
  "$triggers = $xml.SelectSingleNode('//t:Triggers', $ns);" ^
  "$t1 = $triggers.SelectSingleNode('t:CalendarTrigger', $ns);" ^
  "$t2 = $t1.Clone(); $t2.StartBoundary = $t2.StartBoundary -replace 'T\d{2}:\d{2}','T12:55'; $triggers.AppendChild($t2) | Out-Null;" ^
  "$t3 = $t1.Clone(); $t3.StartBoundary = $t3.StartBoundary -replace 'T\d{2}:\d{2}','T16:55'; $triggers.AppendChild($t3) | Out-Null;" ^
  "$xml.Save('%XML_PATH%');"

schtasks /Delete /TN "%TASK_NAME%" /F >nul 2>&1
schtasks /Create /TN "%TASK_NAME%" /XML "%XML_PATH%" /F

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  OK: Scheduled task registered!
    echo  Task: %TASK_NAME%
    echo  Schedule: Mon-Fri 08:55, 12:55, 16:55
    echo ========================================
) else (
    echo.
    echo ERROR: Failed to register task.
    echo Please run this script as Administrator.
)

del "%XML_PATH%" >nul 2>&1
pause
