#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing NSIS conflicts in installer.nsh...\n');

const installerPath = path.join(__dirname, '..', 'build', 'installer.nsh');

if (!fs.existsSync(installerPath)) {
  console.log('❌ installer.nsh not found at:', installerPath);
  process.exit(1);
}

let content = fs.readFileSync(installerPath, 'utf8');

// Remove conflicting definitions that electron-builder already sets
const conflictingDefines = [
  'MUI_WELCOMEFINISHPAGE_BITMAP',
  'MUI_UNWELCOMEFINISHPAGE_BITMAP'
];

let modified = false;

conflictingDefines.forEach(define => {
  const regex = new RegExp(`^!define\\s+${define}\\s+.*$`, 'gm');
  if (regex.test(content)) {
    console.log(`🔍 Found conflicting definition: ${define}`);
    content = content.replace(regex, `# ${define} is set by electron-builder automatically`);
    modified = true;
  }
});

if (modified) {
  fs.writeFileSync(installerPath, content);
  console.log('✅ Fixed NSIS conflicts in installer.nsh');
  console.log('📝 Conflicting definitions have been commented out');
} else {
  console.log('✅ No NSIS conflicts found in installer.nsh');
}

console.log('\n🚀 You can now try building again with: npm run electron:dist:win');