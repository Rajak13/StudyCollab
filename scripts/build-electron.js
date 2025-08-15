#!/usr/bin/env node

/**
 * Custom Electron build script that handles native dependencies
 * This script provides workarounds for common build issues
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BUILD_CONFIG = {
  skipNativeRebuild: process.argv.includes('--skip-native'),
  packOnly: process.argv.includes('--pack-only'),
  platform: process.argv.find(arg => arg.startsWith('--platform='))?.split('=')[1] || 'current',
  verbose: process.argv.includes('--verbose')
};

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function execCommand(command, options = {}) {
  if (BUILD_CONFIG.verbose) {
    log(`Executing: ${command}`);
  }
  
  try {
    const result = execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8',
      ...options
    });
    return result;
  } catch (error) {
    log(`Command failed: ${command}`, 'error');
    throw error;
  }
}

async function checkPrerequisites() {
  log('Checking build prerequisites...');
  
  // Check Node.js version
  const nodeVersion = process.version;
  log(`Node.js version: ${nodeVersion}`);
  
  // Check if required packages are installed
  const requiredPackages = ['electron', 'electron-builder', 'typescript'];
  
  for (const pkg of requiredPackages) {
    try {
      require.resolve(pkg);
      log(`✓ ${pkg} is installed`);
    } catch (error) {
      log(`✗ ${pkg} is not installed`, 'error');
      throw new Error(`Missing required package: ${pkg}`);
    }
  }
  
  // Check if dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
    log('Created dist directory');
  }
}

async function buildNextJS() {
  log('Building Next.js application...');
  
  try {
    execCommand('npm run build');
    log('Next.js build completed successfully');
  } catch (error) {
    log('Next.js build failed', 'error');
    throw error;
  }
}

async function compileElectron() {
  log('Compiling Electron TypeScript...');
  
  try {
    execCommand('npm run electron:compile');
    log('Electron compilation completed successfully');
  } catch (error) {
    log('Electron compilation failed', 'error');
    throw error;
  }
}

async function handleNativeDependencies() {
  if (BUILD_CONFIG.skipNativeRebuild) {
    log('Skipping native dependencies rebuild (--skip-native flag)');
    return;
  }
  
  log('Handling native dependencies...');
  
  // Check if better-sqlite3 needs rebuilding
  const sqlitePath = path.join('node_modules', 'better-sqlite3');
  
  if (fs.existsSync(sqlitePath)) {
    log('Found better-sqlite3, attempting to handle...');
    
    try {
      // Try to use prebuilt binaries first
      log('Attempting to use prebuilt binaries...');
      execCommand('npm rebuild better-sqlite3 --update-binary', { stdio: 'pipe' });
      log('Successfully used prebuilt binaries');
    } catch (error) {
      log('Prebuilt binaries failed, trying alternative approach...', 'warn');
      
      try {
        // Alternative: Install electron-rebuild and use it
        log('Installing electron-rebuild...');
        execCommand('npm install --save-dev electron-rebuild', { stdio: 'pipe' });
        
        log('Running electron-rebuild...');
        execCommand('npx electron-rebuild', { stdio: 'pipe' });
        log('electron-rebuild completed successfully');
      } catch (rebuildError) {
        log('electron-rebuild also failed, using fallback strategy...', 'warn');
        
        // Fallback: Modify electron-builder config to skip native rebuilding
        await modifyElectronBuilderConfig();
      }
    }
  }
}

async function modifyElectronBuilderConfig() {
  log('Modifying electron-builder configuration for compatibility...');
  
  const packageJsonPath = 'package.json';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Ensure build configuration exists
  if (!packageJson.build) {
    packageJson.build = {};
  }
  
  // Add configuration to skip native rebuilding
  packageJson.build.buildDependenciesFromSource = false;
  packageJson.build.nodeGypRebuild = false;
  
  // Add configuration to include prebuilt binaries
  if (!packageJson.build.files) {
    packageJson.build.files = [];
  }
  
  // Ensure node_modules are included for native dependencies
  if (!packageJson.build.files.includes('node_modules/**/*')) {
    packageJson.build.files.push('node_modules/**/*');
  }
  
  // Write back the modified package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  log('Updated package.json with compatibility settings');
}

async function buildElectronApp() {
  log('Building Electron application...');
  
  const buildCommand = BUILD_CONFIG.packOnly ? 
    'npx electron-builder --dir' : 
    `npx electron-builder${BUILD_CONFIG.platform !== 'current' ? ` --${BUILD_CONFIG.platform}` : ''}`;
  
  try {
    execCommand(buildCommand);
    log('Electron build completed successfully');
  } catch (error) {
    log('Electron build failed', 'error');
    
    // If build fails, try with additional flags
    log('Retrying with additional compatibility flags...', 'warn');
    
    try {
      const retryCommand = `${buildCommand} --config.buildDependenciesFromSource=false --config.nodeGypRebuild=false`;
      execCommand(retryCommand);
      log('Electron build completed successfully on retry');
    } catch (retryError) {
      log('Electron build failed even on retry', 'error');
      throw retryError;
    }
  }
}

async function validateBuild() {
  log('Validating build output...');
  
  const releaseDir = 'release';
  
  if (!fs.existsSync(releaseDir)) {
    throw new Error('Release directory not found');
  }
  
  const files = fs.readdirSync(releaseDir);
  log(`Found ${files.length} files in release directory:`);
  
  files.forEach(file => {
    const filePath = path.join(releaseDir, file);
    const stats = fs.statSync(filePath);
    const size = stats.isFile() ? `(${Math.round(stats.size / 1024 / 1024)}MB)` : '(directory)';
    log(`  - ${file} ${size}`);
  });
  
  // Check for expected files
  const expectedExtensions = ['.exe', '.dmg', '.AppImage', '.deb', '.rpm'];
  const hasInstaller = files.some(file => 
    expectedExtensions.some(ext => file.toLowerCase().endsWith(ext))
  );
  
  if (hasInstaller) {
    log('✓ Installer files found');
  } else {
    log('⚠️ No installer files found (this might be expected for --dir builds)', 'warn');
  }
}

async function cleanup() {
  log('Performing cleanup...');
  
  // Clean up temporary files
  const tempDirs = ['.next', 'dist/electron'];
  
  tempDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      log(`Cleaning up ${dir}...`);
      // Note: In a real implementation, you'd use a proper recursive delete
      // For now, we'll just log it
    }
  });
}

async function main() {
  const startTime = Date.now();
  
  try {
    log('🚀 Starting StudyCollab Electron build process...');
    log(`Build configuration: ${JSON.stringify(BUILD_CONFIG, null, 2)}`);
    
    await checkPrerequisites();
    await buildNextJS();
    await compileElectron();
    await handleNativeDependencies();
    await buildElectronApp();
    await validateBuild();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    log(`🎉 Build completed successfully in ${duration} seconds!`);
    
    // Print next steps
    console.log('\n📋 Next Steps:');
    console.log('  - Test the built application in the release/ directory');
    console.log('  - Run validation: node scripts/validate-installer-config.js');
    console.log('  - Create release: npm run electron:publish');
    
  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    log(`💥 Build failed after ${duration} seconds`, 'error');
    log(`Error: ${error.message}`, 'error');
    
    // Print troubleshooting tips
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('  - Try: npm run build-electron -- --skip-native');
    console.log('  - Install Visual Studio Build Tools if needed');
    console.log('  - Check: node scripts/validate-installer-config.js');
    console.log('  - See: docs/installer-distribution-setup.md');
    
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Handle command line usage
if (require.main === module) {
  // Print usage if help requested
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
StudyCollab Electron Build Script

Usage: node scripts/build-electron.js [options]

Options:
  --skip-native     Skip native dependencies rebuild
  --pack-only       Only pack, don't create installer
  --platform=<p>    Target platform (win, mac, linux)
  --verbose         Enable verbose logging
  --help, -h        Show this help message

Examples:
  node scripts/build-electron.js
  node scripts/build-electron.js --skip-native
  node scripts/build-electron.js --pack-only --platform=win
    `);
    process.exit(0);
  }
  
  main().catch(console.error);
}

module.exports = {
  buildElectronApp: main,
  BUILD_CONFIG
};