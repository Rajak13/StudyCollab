#!/usr/bin/env node

/**
 * Check Node.js version and provide upgrade instructions
 */

const semver = require('semver');
const currentVersion = process.version;
const requiredVersion = '20.0.0';

console.log(`Current Node.js version: ${currentVersion}`);

if (semver.lt(currentVersion, requiredVersion)) {
  console.log(`\n⚠️  Node.js ${requiredVersion} or higher is recommended for this project`);
  console.log(`   Current version: ${currentVersion}`);
  console.log(`   Required version: ${requiredVersion}+`);
  
  console.log('\n📋 How to upgrade Node.js:');
  console.log('');
  console.log('Option 1: Using Node Version Manager (nvm) - Recommended');
  console.log('  Windows: Download nvm-windows from https://github.com/coreybutler/nvm-windows');
  console.log('  macOS/Linux: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash');
  console.log('  Then run: nvm install 20 && nvm use 20');
  console.log('');
  console.log('Option 2: Direct download');
  console.log('  Visit https://nodejs.org and download the LTS version');
  console.log('');
  console.log('Option 3: Using package managers');
  console.log('  Windows (Chocolatey): choco install nodejs');
  console.log('  macOS (Homebrew): brew install node');
  console.log('  Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs');
  
  console.log('\n⚠️  Some packages may not work correctly with Node.js 18');
  console.log('   The build may still work, but upgrading is recommended');
  
  // Don't exit with error - just warn
  process.exit(0);
} else {
  console.log('✅ Node.js version is compatible');
}