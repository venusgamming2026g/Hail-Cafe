@echo off
setlocal
title Hail Cafe - Local
cd /d "%~dp0"

if not exist "node_modules" (
  echo Installing Hail Cafe dependencies...
  call npm ci
  if errorlevel 1 goto :failed
)

if not exist ".wrangler\state" (
  echo Preparing the local Hail Cafe database...
  call npx wrangler d1 execute site-creator-d1 --local --file drizzle/0000_organic_warpath.sql --config wrangler.local.jsonc --persist-to .wrangler/state --yes
  if errorlevel 1 goto :failed
)

echo Starting Hail Cafe locally...
call npm run dev -- --open
goto :eof

:failed
echo.
echo Hail Cafe could not start. Review the message above.
pause
