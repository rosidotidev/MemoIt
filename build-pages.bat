@echo off
setlocal
cd /d "%~dp0"

echo Building MemoIt (production, base href /memoit/)...
call npm run build:prod -- --base-href /memoit/
if errorlevel 1 (
  echo Build failed.
  exit /b 1
)

set OUT=dist\memoit\browser
if not exist "%OUT%\index.html" (
  echo index.html not found in %OUT%
  exit /b 1
)

rem GitHub Pages: a reloaded deep link must fall back to the app
copy /y "%OUT%\index.html" "%OUT%\404.html" >nul

echo.
echo Done. Publish the contents of %OUT%
endlocal
