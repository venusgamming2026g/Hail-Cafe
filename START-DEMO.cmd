@echo off
setlocal
title Restaurant OS Demo - Local
cd /d "%~dp0"

if not exist "node_modules" (
  echo Installing Restaurant OS dependencies...
  call npm install
  if errorlevel 1 goto :failed
)

if not exist ".wrangler\state" (
  echo Preparing the local database...
  call npx wrangler d1 execute site-creator-d1 --local --file drizzle/0000_organic_warpath.sql --config wrangler.local.jsonc --persist-to .wrangler/state --yes
  if errorlevel 1 goto :failed
)

echo Starting Restaurant OS Demo locally...
call npm run dev -- --open
goto :eof

:failed
echo.
echo Restaurant OS Demo could not start. Review the message above.
pause
