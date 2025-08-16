#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating build configuration...\n');

// Check required files
const requiredFiles = [
  'assets/icon.ico',
  'assets/icon.icns', 
  'assets/icon.png',
  'assets/entitlements.mac.plist',
  'build/installer.nsh'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

// Check package.json configuration
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

console.log('\n📦 Package.json build configuration:');
console.log(`✅ App ID: ${packageJson.build.appId}`);
console.log(`✅ Product Name: ${packageJson.build.productName}`);

// Check platform configurations
const platforms = ['win', 'mac', 'linux'];
platforms.forEach(platform => {
  if (packageJson.build[platform]) {
    console.log(`✅ ${platform.toUpperCase()} configuration exists`);
    if (packageJson.build[platform].target) {
      console.log(`   Targets: ${packageJson.build[platform].target.map(t => t.target).join(', ')}`);
    }
  } else {
    console.log(`❌ ${platform.toUpperCase()} configuration missing`);
    allFilesExist = false;
  }
});

console.log('\n🔧 Build scripts:');
const scripts = packageJson.scripts;
if (scripts['electron:build']) {
  console.log('✅ electron:build script exists');
} else {
  console.log('❌ electron:build script missing');
}

if (allFilesExist) {
  console.log('\n🎉 All build configuration checks passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some build configuration issues found. Please fix them before building.');
  process.exit(1);
}