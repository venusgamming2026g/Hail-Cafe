@echo off
chcp 65001 >nul
setlocal
title HAIL OS - نظام هيل كافيه
cd /d "%~dp0hail-os"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js غير مثبّت على هذا الجهاز.
  echo   حمّله من: https://nodejs.org  ثم شغّل هذا الملف من جديد.
  echo.
  pause
  exit /b 1
)

echo.
echo   جارٍ تشغيل نظام هيل كافيه...
echo.
set HAIL_OPEN=1
node server.mjs 3000

echo.
echo   توقّف النظام.
pause
