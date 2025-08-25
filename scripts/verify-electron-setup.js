#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying StudyCollab Electron Setup...\n');

const checks = [
  {
    name: 'Package.json has Electron dependencies',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.devDependencies?.electron && 
             pkg.devDependencies['electron-builder'] && 
             pkg.devDependencies['electron-updater'];
    }
  },
  {
    name: 'Electron main.ts exists',
    check: () => fs.existsSync('electron/main.ts')
  },
  {
    name: 'Electron preload.ts exists',
    check: () => fs.existsSync('electron/preload.ts')
  },
  {
    name: 'Electron TypeScript config exists',
    check: () => fs.existsSync('electron/tsconfig.json')
  },
  {
    name: 'Desktop API types exist',
    check: () => fs.existsSync('types/desktop.d.ts')
  },
  {
    name: 'Desktop API hook exists',
    check: () => fs.existsSync('src/hooks/useDesktopAPI.ts')
  },
  {
    name: 'Assets directory exists',
    check: () => fs.existsSync('assets')
  },
  {
    name: 'Electron scripts in package.json',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.scripts['electron:dev'] && 
             pkg.scripts['electron:build'] && 
             pkg.scripts['electron:compile'];
    }
  },
  {
    name: 'Build configuration exists',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.build && pkg.build.appId;
    }
  },
  {
    name: 'Compiled Electron files exist',
    check: () => fs.existsSync('dist/electron/main.js') && fs.existsSync('dist/electron/preload.js')
  }
];

let passed = 0;
let failed = 0;

checks.forEach(({ name, check }) => {
  try {
    if (check()) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${name} (Error: ${error.message})`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n🎉 Electron setup is complete and ready for development!');
  console.log('\nNext steps:');
  console.log('1. Run "npm run electron:dev" to start development');
  console.log('2. Run "npm run electron:test" to test basic Electron functionality');
  console.log('3. Begin implementing the interactive landing page (Task 2)');
} else {
  console.log('\n⚠️  Some setup components are missing. Please review the failed checks above.');
  process.exit(1);
}