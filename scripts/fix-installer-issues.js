#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing installer issues...\n');

const packagePath = path.join(__dirname, '..', 'package.json');
const installerPath = path.join(__dirname, '..', 'build', 'installer.nsh');
const simpleInstallerPath = path.join(__dirname, '..', 'build', 'installer-simple.nsh');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Option 1: Switch to simple installer
function useSimpleInstaller() {
  console.log('📝 Switching to simple installer configuration...');
  
  if (fs.existsSync(simpleInstallerPath)) {
    packageJson.build.nsis.include = 'build/installer-simple.nsh';
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Switched to simple installer (no custom graphics)');
    return true;
  } else {
    console.log('❌ Simple installer file not found');
    return false;
  }
}

// Option 2: Remove custom installer entirely
function removeCustomInstaller() {
  console.log('📝 Removing custom installer configuration...');
  
  if (packageJson.build.nsis.include) {
    delete packageJson.build.nsis.include;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Removed custom installer - using electron-builder defaults');
    return true;
  } else {
    console.log('ℹ️ No custom installer configured');
    return false;
  }
}

// Option 3: Fix path issues in current installer
function fixInstallerPaths() {
  console.log('📝 Fixing path issues in current installer...');
  
  if (!fs.existsSync(installerPath)) {
    console.log('❌ Installer file not found');
    return false;
  }
  
  let content = fs.readFileSync(installerPath, 'utf8');
  
  // Remove problematic header image references
  const problematicLines = [
    /!define\s+MUI_HEADERIMAGE\s*$/gm,
    /!define\s+MUI_HEADERIMAGE_BITMAP\s+.*$/gm
  ];
  
  let modified = false;
  problematicLines.forEach(regex => {
    if (regex.test(content)) {
      content = content.replace(regex, '# Removed problematic header image definition');
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(installerPath, content);
    console.log('✅ Fixed path issues in installer');
    return true;
  } else {
    console.log('ℹ️ No path issues found');
    return false;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const action = args[0] || 'auto';

switch (action) {
  case 'simple':
    useSimpleInstaller();
    break;
  case 'remove':
    removeCustomInstaller();
    break;
  case 'fix':
    fixInstallerPaths();
    break;
  case 'auto':
  default:
    console.log('🤖 Auto-fixing installer issues...');
    if (!fixInstallerPaths()) {
      if (!useSimpleInstaller()) {
        removeCustomInstaller();
      }
    }
    break;
}

console.log('\n🚀 Try building again with: npm run electron:dist:win');
console.log('\nAvailable options:');
console.log('  node scripts/fix-installer-issues.js simple  # Use simple installer');
console.log('  node scripts/fix-installer-issues.js remove  # Remove custom installer');
console.log('  node scripts/fix-installer-issues.js fix     # Fix current installer');
console.log('  node scripts/fix-installer-issues.js auto    # Auto-fix (default)');