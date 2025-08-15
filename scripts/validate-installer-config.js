#!/usr/bin/env node

/**
 * Validation script for electron-builder installer configuration
 * This script validates the installer setup without requiring a full build
 */

const fs = require('fs');
const path = require('path');

// Configuration validation
function validateInstallerConfig() {
  console.log('🔍 Validating StudyCollab Installer Configuration');
  console.log('================================================\n');

  let hasErrors = false;

  // Check package.json
  console.log('📦 Checking package.json configuration...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check required fields
    const requiredFields = ['name', 'version', 'description', 'author', 'main'];
    for (const field of requiredFields) {
      if (!packageJson[field]) {
        console.log(`❌ Missing required field: ${field}`);
        hasErrors = true;
      } else {
        console.log(`✅ ${field}: ${typeof packageJson[field] === 'object' ? 'configured' : packageJson[field]}`);
      }
    }

    // Check build configuration
    if (!packageJson.build) {
      console.log('❌ Missing build configuration');
      hasErrors = true;
    } else {
      console.log('✅ Build configuration found');
      
      // Check specific build settings
      const build = packageJson.build;
      
      if (build.appId) {
        console.log(`✅ App ID: ${build.appId}`);
      } else {
        console.log('❌ Missing appId');
        hasErrors = true;
      }

      if (build.productName) {
        console.log(`✅ Product Name: ${build.productName}`);
      } else {
        console.log('❌ Missing productName');
        hasErrors = true;
      }

      // Check Windows configuration
      if (build.win) {
        console.log('✅ Windows configuration found');
        
        if (build.win.fileAssociations && build.win.fileAssociations.length > 0) {
          console.log(`✅ File associations: ${build.win.fileAssociations.length} types`);
          build.win.fileAssociations.forEach(assoc => {
            console.log(`   - .${assoc.ext}: ${assoc.name}`);
          });
        }

        if (build.win.protocols && build.win.protocols.length > 0) {
          console.log(`✅ Protocol handlers: ${build.win.protocols.length}`);
          build.win.protocols.forEach(protocol => {
            console.log(`   - ${protocol.schemes.join(', ')}: ${protocol.name}`);
          });
        }
      }

      // Check NSIS configuration
      if (build.nsis) {
        console.log('✅ NSIS configuration found');
        console.log(`   - One-click: ${build.nsis.oneClick}`);
        console.log(`   - Desktop shortcut: ${build.nsis.createDesktopShortcut}`);
        console.log(`   - Start menu: ${build.nsis.createStartMenuShortcut}`);
      }
    }

  } catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
    hasErrors = true;
  }

  // Check required asset files
  console.log('\n🎨 Checking required asset files...');
  
  const requiredAssets = [
    'assets/icon.ico',
    'assets/icon.icns', 
    'assets/icon.png',
    'assets/note-icon.ico',
    'assets/task-icon.ico',
    'assets/board-icon.ico'
  ];

  for (const asset of requiredAssets) {
    if (fs.existsSync(asset)) {
      const stats = fs.statSync(asset);
      console.log(`✅ ${asset} (${Math.round(stats.size / 1024)}KB)`);
    } else {
      console.log(`❌ Missing: ${asset}`);
      hasErrors = true;
    }
  }

  // Check installer assets (optional but recommended)
  console.log('\n🖼️  Checking installer graphics...');
  
  const installerAssets = [
    'assets/installer-sidebar.bmp',
    'assets/uninstaller-sidebar.bmp'
  ];

  for (const asset of installerAssets) {
    if (fs.existsSync(asset)) {
      console.log(`✅ ${asset}`);
    } else {
      console.log(`⚠️  Optional: ${asset} (will use default)`);
    }
  }

  // Check build directory and scripts
  console.log('\n📁 Checking build configuration...');
  
  if (fs.existsSync('build/installer.nsh')) {
    console.log('✅ Custom NSIS script found');
  } else {
    console.log('⚠️  No custom NSIS script (will use defaults)');
  }

  if (fs.existsSync('LICENSE')) {
    console.log('✅ License file found');
  } else {
    console.log('❌ Missing LICENSE file');
    hasErrors = true;
  }

  // Check TypeScript configuration
  console.log('\n⚙️  Checking TypeScript configuration...');
  
  if (fs.existsSync('tsconfig.electron.json')) {
    console.log('✅ Electron TypeScript config found');
  } else {
    console.log('❌ Missing tsconfig.electron.json');
    hasErrors = true;
  }

  // Check electron main file
  console.log('\n🔌 Checking Electron main process...');
  
  if (fs.existsSync('electron/main.ts')) {
    console.log('✅ Electron main.ts found');
  } else {
    console.log('❌ Missing electron/main.ts');
    hasErrors = true;
  }

  // Check auto-updater setup
  console.log('\n🔄 Checking auto-updater configuration...');
  
  if (fs.existsSync('electron/managers/auto-updater-manager.ts')) {
    console.log('✅ Auto-updater manager found');
  } else {
    console.log('❌ Missing auto-updater manager');
    hasErrors = true;
  }

  // Check API endpoints
  console.log('\n🌐 Checking API endpoints...');
  
  const apiEndpoints = [
    'src/app/api/download/route.ts',
    'src/app/api/releases/latest/route.ts'
  ];

  for (const endpoint of apiEndpoints) {
    if (fs.existsSync(endpoint)) {
      console.log(`✅ ${endpoint}`);
    } else {
      console.log(`❌ Missing: ${endpoint}`);
      hasErrors = true;
    }
  }

  // Summary
  console.log('\n📋 Validation Summary');
  console.log('====================');
  
  if (hasErrors) {
    console.log('❌ Configuration has errors that need to be fixed');
    console.log('\n🔧 Next steps:');
    console.log('   1. Fix the errors listed above');
    console.log('   2. Run this script again to validate');
    console.log('   3. Test build with: npm run electron:pack');
    return false;
  } else {
    console.log('✅ Configuration looks good!');
    console.log('\n🚀 Ready to build:');
    console.log('   - Development: npm run electron:dev');
    console.log('   - Pack: npm run electron:pack');
    console.log('   - Distribute: npm run electron:dist');
    console.log('   - Publish: npm run electron:publish');
    return true;
  }
}

// Environment check
function checkEnvironment() {
  console.log('\n🌍 Environment Check');
  console.log('===================');
  
  // Check Node.js version
  const nodeVersion = process.version;
  console.log(`Node.js: ${nodeVersion}`);
  
  // Check npm version
  try {
    const { execSync } = require('child_process');
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`npm: ${npmVersion}`);
  } catch (error) {
    console.log('npm: Not available');
  }

  // Check if electron-builder is installed
  try {
    require.resolve('electron-builder');
    console.log('✅ electron-builder: Installed');
  } catch (error) {
    console.log('❌ electron-builder: Not installed');
  }

  // Check if electron is installed
  try {
    require.resolve('electron');
    console.log('✅ electron: Installed');
  } catch (error) {
    console.log('❌ electron: Not installed');
  }

  // Check environment variables
  const envVars = [
    'NEXT_PUBLIC_RELEASE_OWNER',
    'NEXT_PUBLIC_RELEASE_REPO',
    'GITHUB_TOKEN'
  ];

  console.log('\n🔐 Environment Variables:');
  for (const envVar of envVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: Set`);
    } else {
      console.log(`⚠️  ${envVar}: Not set (optional)`);
    }
  }
}

// Main execution
if (require.main === module) {
  const isValid = validateInstallerConfig();
  checkEnvironment();
  
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateInstallerConfig, checkEnvironment };