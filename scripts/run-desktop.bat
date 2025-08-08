@echo off
echo StudyCollab Desktop App Setup
echo ==============================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo npm version:
npm --version
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo WARNING: .env.local file not found
    echo Please create .env.local with your Supabase credentials
    echo Example:
    echo NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    echo SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    echo.
    pause
)

echo Building the application...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build the application
    pause
    exit /b 1
)

echo Compiling Electron files...
npm run electron:compile
if %errorlevel% neq 0 (
    echo ERROR: Failed to compile Electron files
    pause
    exit /b 1
)

echo.
echo Starting StudyCollab Desktop App...
echo Press Ctrl+C to stop the application
echo.

npm run electron:dev