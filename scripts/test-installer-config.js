#!/usr/bin/env node

/**
 * Test script to validate installer configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing StudyCollab Installer Configuration...\n');

// Test 1: Check package.json build configuration
console.log('1. Checking package.json build configuration...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const buildConfig = packageJson.build;
  
  if (!buildConfig) {
    console.error('❌ No build configuration found in package.json');
    process.exit(1);
  }
  
  // Check required fields
  const requiredFields = ['appId', 'productName', 'directories', 'files'];
  for (const field of requiredFields) {
    if (!buildConfig[field]) {
      console.error(`❌ Missing required build field: ${field}`);
      process.exit(1);
    }
  }
  
  // Check NSIS configuration
  if (!buildConfig.nsis) {
    console.error('❌ Missing NSIS configuration');
    process.exit(1);
  }
  
  console.log('✅ Package.json build configuration is valid');
} catch (error) {
  console.error('❌ Error reading package.json:', error.message);
  process.exit(1);
}

// Test 2: Check required asset files
console.log('\n2. Checking required asset files...');
const requiredAssets = [
  'assets/icon.ico',
  'assets/icon.icns', 
  'assets/icon.png',
  'assets/note-icon.ico',
  'assets/task-icon.ico',
  'assets/board-icon.ico'
];

let missingAssets = [];
for (const asset of requiredAssets) {
  if (!fs.existsSync(asset)) {
    missingAssets.push(asset);
  }
}

if (missingAssets.length > 0) {
  console.warn('⚠️  Missing optional assets:', missingAssets.join(', '));
} else {
  console.log('✅ All required assets are present');
}

// Test 3: Check NSIS installer script
console.log('\n3. Checking NSIS installer script...');
if (fs.existsSync('build/installer.nsh')) {
  console.log('✅ NSIS installer script found');
} else {
  console.warn('⚠️  NSIS installer script not found (build/installer.nsh)');
}

// Test 4: Check Electron main file
console.log('\n4. Checking Electron main file...');
if (fs.existsSync('electron/main.ts')) {
  console.log('✅ Electron main file found');
} else {
  console.error('❌ Electron main file not found (electron/main.ts)');
  process.exit(1);
}

// Test 5: Check TypeScript configuration
console.log('\n5. Checking TypeScript configuration...');
if (fs.existsSync('tsconfig.electron.json')) {
  console.log('✅ Electron TypeScript configuration found');
} else {
  console.error('❌ Electron TypeScript configuration not found');
  process.exit(1);
}

// Test 6: Check auto-updater manager
console.log('\n6. Checking auto-updater manager...');
if (fs.existsSync('electron/managers/auto-updater-manager.ts')) {
  console.log('✅ Auto-updater manager found');
} else {
    console.error('uto-updater manager not found');
    process.exit();
}
