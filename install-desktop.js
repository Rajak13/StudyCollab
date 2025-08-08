#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 StudyCollab Desktop App Installer');
console.log('=====================================\n');

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Error: Node.js 18 or higher is required');
  console.error(`   Current version: ${nodeVersion}`);
  console.error('   Please update Node.js from https://nodejs.org/');
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found');
  console.error('   Please run this script from the studycollab-mvp directory');
  process.exit(1);
}

// Check if this is the StudyCollab project
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.name !== 'studycollab-mvp') {
  console.error('❌ Error: This doesn\'t appear to be the StudyCollab project');
  process.exit(1);
}

console.log(`✅ Found StudyCollab project v${packageJson.version}`);

// Check for .env.local
if (!fs.existsSync('.env.local')) {
  console.log('\n⚠️  Warning: .env.local file not found');
  console.log('   Creating a template .env.local file...');
  
  const envTemplate = `# StudyCollab Environment Configuration
# Copy this file to .env.local and fill in your actual values

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Custom configuration
# NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

  fs.writeFileSync('.env.local', envTemplate);
  console.log('   📝 Created .env.local template');
  console.log('   🔧 Please edit .env.local with your Supabase credentials before running the app');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  console.error(error.message);
  process.exit(1);
}

// Build the application
console.log('\n🔨 Building the application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Application built successfully');
} catch (error) {
  console.error('❌ Failed to build application');
  console.error(error.message);
  process.exit(1);
}

// Compile Electron files
console.log('\n⚡ Compiling Electron files...');
try {
  execSync('npm run electron:compile', { stdio: 'inherit' });
  console.log('✅ Electron files compiled successfully');
} catch (error) {
  console.error('❌ Failed to compile Electron files');
  console.error(error.message);
  process.exit(1);
}

// Create desktop shortcuts and scripts
console.log('\n🖥️  Setting up desktop integration...');

const platform = os.platform();
const scriptsDir = path.join(__dirname, 'scripts');

if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

// Create platform-specific launcher
if (platform === 'win32') {
  const launcherScript = `@echo off
cd /d "${__dirname}"
npm run electron:dev
pause`;
  
  fs.writeFileSync(path.join(scriptsDir, 'launch-studycollab.bat'), launcherScript);
  console.log('✅ Created Windows launcher script');
  
} else {
  const launcherScript = `#!/bin/bash
cd "${__dirname}"
npm run electron:dev`;
  
  fs.writeFileSync(path.join(scriptsDir, 'launch-studycollab.sh'), launcherScript);
  
  try {
    execSync('chmod +x scripts/launch-studycollab.sh');
    console.log('✅ Created Unix launcher script');
  } catch (error) {
    console.log('⚠️  Created launcher script (you may need to make it executable)');
  }
}

// Success message
console.log('\n🎉 StudyCollab Desktop App setup complete!');
console.log('\n📋 Next steps:');
console.log('   1. Edit .env.local with your Supabase credentials');
console.log('   2. Run the desktop app:');

if (platform === 'win32') {
  console.log('      • Double-click: scripts\\launch-studycollab.bat');
  console.log('      • Or run: npm run electron:dev');
} else {
  console.log('      • Run: ./scripts/launch-studycollab.sh');
  console.log('      • Or run: npm run electron:dev');
}

console.log('\n🔧 Available commands:');
console.log('   • npm run electron:dev     - Development mode with hot reload');
console.log('   • npm run electron:build   - Build for production');
console.log('   • npm run electron:dist    - Create distributable packages');

console.log('\n📖 Documentation:');
console.log('   • README-DESKTOP.md        - Desktop app guide');
console.log('   • docs/desktop-app-local-setup.md - Detailed setup instructions');

console.log('\n🆘 Need help?');
console.log('   • GitHub: https://github.com/studycollab/studycollab');
console.log('   • Email: support@studycollab.app');

console.log('\n✨ Happy studying with StudyCollab! ✨');