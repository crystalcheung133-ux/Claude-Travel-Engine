@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Update-VN.ps1" %*
pause
