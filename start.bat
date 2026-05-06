@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  ^>^> MORPHAI Server Starting...
echo.
start "MORPHAI Server" /MIN node server.js
timeout /t 2 /nobreak >nul
start "" http://localhost:3000/
echo  Browser opened at http://localhost:3000/
echo.
echo  Admin: http://localhost:3000/content-admin/admin.html
echo  Password: liujun2025
echo.
echo  Close the server window to stop.
echo.
pause
