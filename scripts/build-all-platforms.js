#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

console.log('🚀 Building StudyCollab for all platforms...\n');

const platform = os.platform();
console.log(`Current platform: ${platform}`);

// Build commands for different platforms
const buildCommands = {
  win32: [
    'npm run electron:build -- --win',
    'npm run electron:build -- --win --ia32'
  ],
  darwin: [
    'npm run electron:build -- --mac',
    'npm run electron:build -- --mac --x64 --arm64'
  ],
  linux: [
    'npm run electron:build -- --linux',
    'npm run electron:build -- --linux AppImage',
    'npm run electron:build -- --linux deb',
    'npm run electron:build -- --linux rpm'
  ]
};

// Cross-platform builds (when building from any platform)
const crossPlatformCommands = {
  windows: 'npm run electron:build -- --win --x64 --ia32',
  mac: 'npm run electron:build -- --mac --x64 --arm64', 
  linux: 'npm run electron:build -- --linux AppImage deb rpm'
};

function runCommand(command, description) {
  console.log(`\n📦 ${description}`);
  console.log(`Running: ${command}`);
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const buildTarget = args[0]; // 'windows', 'mac', 'linux', or 'all'

if (!buildTarget) {
  console.log('Usage: node build-all-platforms.js [windows|mac|linux|all]');
  console.log('\nExamples:');
  console.log('  node build-all-platforms.js windows  # Build for Windows only');
  console.log('  node build-all-platforms.js mac      # Build for macOS only');
  console.log('  node build-all-platforms.js linux    # Build for Linux only');
  console.log('  node build-all-platforms.js all      # Build for all platforms');
  process.exit(1);
}

let success = true;

// First, ensure the web build is ready
console.log('🔧 Building web application first...');
if (!runCommand('npm run build', 'Web application build')) {
  process.exit(1);
}

// Then compile electron
console.log('🔧 Compiling Electron application...');
if (!runCommand('npm run electron:compile', 'Electron compilation')) {
  process.exit(1);
}

// Build for specified platforms
if (buildTarget === 'all') {
  console.log('\n🌍 Building for all platforms...');
  
  if (!runCommand(crossPlatformCommands.windows, 'Windows build')) success = false;
  if (!runCommand(crossPlatformCommands.mac, 'macOS build')) success = false;
  if (!runCommand(crossPlatformCommands.linux, 'Linux build')) success = false;
  
} else if (buildTarget === 'windows') {
  success = runCommand(crossPlatformCommands.windows, 'Windows build');
} else if (buildTarget === 'mac') {
  success = runCommand(crossPlatformCommands.mac, 'macOS build');
} else if (buildTarget === 'linux') {
  success = runCommand(crossPlatformCommands.linux, 'Linux build');
} else {
  console.error(`❌ Unknown build target: ${buildTarget}`);
  process.exit(1);
}

if (success) {
  console.log('\n🎉 All builds completed successfully!');
  console.log('\n📁 Check the "release" folder for your built applications.');
} else {
  console.log('\n❌ Some builds failed. Check the output above for details.');
  process.exit(1);
}