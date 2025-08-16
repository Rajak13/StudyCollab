#!/usr/bin/env node

/**
 * Complete desktop build script that ensures everything works
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 StudyCollab Desktop Complete Build Script\n');

// Load environment variables from .env.local
function loadEnvLocal() {
  const envLocalPath = '.env.local';
  if (fs.existsSync(envLocalPath)) {
    console.log('📄 Loading environment variables from .env.local');
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
        const equalIndex = trimmedLine.indexOf('=');
        const key = trimmedLine.substring(0, equalIndex).trim();
        const value = trimmedLine.substring(equalIndex + 1).trim();
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
    console.log('✅ Environment variables loaded');
  } else {
    console.log('⚠️  No .env.local file found');
  }
}

// Check Node.js version
function checkNodeVersion() {
  const currentVersion = process.version;
  const major = parseInt(currentVersion.slice(1).split('.')[0]);
  
  console.log(`📋 Node.js version: ${currentVersion}`);
  
  if (major < 20) {
    console.log('❌ Node.js 20+ is required for this build');
    console.log('   Please upgrade Node.js and try again');
    process.exit(1);
  }
  
  console.log('✅ Node.js version is compatible');
}

// Verify environment variables
function verifyEnvironment() {
  console.log('🔍 Verifying environment variables...');
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = [];
  
  required.forEach(key => {
    if (!process.env[key] || process.env[key].includes('placeholder')) {
      missing.push(key);
    }
  });
  
  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(key => console.log(`   - ${key}`));
    console.log('\n💡 Please check your .env.local file');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
}

// Build steps
function runBuild() {
  try {
    console.log('\n🏗️  Step 1: Building Next.js application...');
    execSync('npm run build', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✅ Next.js build completed');
    
    console.log('\n🔧 Step 2: Compiling Electron...');
    execSync('npm run electron:compile', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✅ Electron compilation completed');
    
    console.log('\n📦 Step 3: Building desktop distributables...');
    execSync('npm run electron:dist', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✅ Desktop build completed');
    
    console.log('\n🎉 Desktop application build successful!');
    console.log('📁 Check the "release" folder for your installers');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure all dependencies are installed: npm ci');
    console.log('2. Check that environment variables are correct');
    console.log('3. Verify Node.js version is 20+');
    console.log('4. Try cleaning node_modules and reinstalling');
    process.exit(1);
  }
}

// Main execution
async function main() {
  loadEnvLocal();
  checkNodeVersion();
  verifyEnvironment();
  runBuild();
}

main().catch(console.error);