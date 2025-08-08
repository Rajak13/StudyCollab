#!/bin/bash

echo "StudyCollab Desktop App Setup"
echo "=============================="
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js version:"
node --version
echo

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed or not in PATH"
    exit 1
fi

echo "npm version:"
npm --version
echo

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
    echo
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "WARNING: .env.local file not found"
    echo "Please create .env.local with your Supabase credentials"
    echo "Example:"
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo
    read -p "Press Enter to continue..."
fi

echo "Building the application..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build the application"
    exit 1
fi

echo "Compiling Electron files..."
npm run electron:compile
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to compile Electron files"
    exit 1
fi

echo
echo "Starting StudyCollab Desktop App..."
echo "Press Ctrl+C to stop the application"
echo

npm run electron:dev