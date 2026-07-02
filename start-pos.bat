@echo off
title BentaHub POS
cd /d "%~dp0"

echo ========================================
echo   BENTAHUB POS - Starting Services
echo ========================================
echo.

:: Start the print server in background
echo [1/2] Starting Print Server...
start /MIN "BentaHub Print Server" node server\print-server.cjs
if %errorlevel% neq 0 (
  echo [!] Print Server may already be running on port 3001
)
echo       -> Print Server running on http://localhost:3001
echo.

:: Start Next.js dev server
echo [2/2] Starting Next.js...
echo.
npx next dev --turbopack

:: Cleanup when Next.js stops
echo.
echo Shutting down Print Server...
taskkill /FI "WINDOWTITLE eq BentaHub Print Server" /F > NUL 2>&1
echo Done.
pause
