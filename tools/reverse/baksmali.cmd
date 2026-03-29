@echo off
setlocal
set SCRIPT_DIR=%~dp0
java -jar "%SCRIPT_DIR%baksmali-2.5.2.jar" %*
exit /b %ERRORLEVEL%
