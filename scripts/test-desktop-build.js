#!/usr/bin/env node

/**
 * Test script to verify desktop build artifacts
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing StudyCollab Desktop Build Artifacts\n');

const releaseDir = 'release';

if (!fs.existsSync(releaseDir)) {
  console.log('❌ Release directory not found');
  console.log('   Run "npm run electron:dist" first');
  process.exit(1);
}

console.log('📁 Checking release directory...');
const files = fs.readdirSync(releaseDir);

const expectedFiles = {
  'StudyCollab-Setup-0.1.0.exe': 'Windows Installer',
  'win-unpacked': 'Windows Unpacked App',
  'win-ia32-unpacked': 'Windows 32-bit Unpacked App',
  'latest.yml': 'Auto-updater Configuration'
};

console.log('\n📋 Build Artifacts:');
Object.entries(expectedFiles).forEach(([file, description]) => {
  if (files.includes(file) || fs.existsSync(path.join(releaseDir, file))) {
    console.log(`✅ ${file} - ${description}`);
  } else {
    console.log(`❌ ${file} - ${description} (Missing)`);
  }
});

console.log('\n📊 All files in release directory:');
files.forEach(file => {
  const filePath = path.join(releaseDir, file);
  const stats = fs.statSync(filePath);
  const size = stats.isDirectory() ? 'Directory' : `${Math.round(stats.size / 1024 / 1024 * 100) / 100} MB`;
  console.log(`   ${file} (${size})`);
});

// Check if the main executable exists
const mainExe = path.join(releaseDir, 'win-unpacked', 'StudyCollab.exe');
if (fs.existsSync(mainExe)) {
  console.log('\n✅ Main executable found and ready to run');
  console.log(`   Location: ${mainExe}`);
} else {
  console.log('\n❌ Main executable not found');
}

console.log('\n🎉 Desktop build verification complete!');
console.log('\n📝 Next steps:');
console.log('1. Test the installer: run the .exe file');
console.log('2. Test the unpacked app: run StudyCollab.exe from win-unpacked folder');
console.log('3. Create a GitHub release to distribute the installer');