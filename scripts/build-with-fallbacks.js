#!/usr/bin/env node

/**
 * Build script that handles missing environment variables gracefully
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Building StudyCollab with environment fallbacks...\n');

// Load .env.local if it exists
const fs = require('fs');
const path = require('path');
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
        console.log(`✅ Loaded ${key}`);
      }
    }
  });
} else {
  console.log('⚠️  No .env.local file found');
}

// Set fallback environment variables if not present
const envFallbacks = {
  'NEXT_PUBLIC_SUPABASE_URL': 'https://placeholder.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'placeholder-key',
  'NEXT_PUBLIC_RELEASE_OWNER': 'Rajak13',
  'NEXT_PUBLIC_RELEASE_REPO': 'StudyCollab',
  'NODE_ENV': 'production'
};

// Apply fallbacks for missing environment variables
Object.entries(envFallbacks).forEach(([key, fallback]) => {
  if (!process.env[key]) {
    console.log(`⚠️  Setting fallback for ${key}`);
    process.env[key] = fallback;
  }
});

// Check if we have real Supabase config
const hasRealSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';

if (!hasRealSupabase) {
  console.log('⚠️  Building with placeholder Supabase configuration');
  console.log('   Some features will be disabled until real configuration is provided');
}

try {
  console.log('1️⃣ Running Next.js build...');
  execSync('npx next build', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('\n✅ Build completed successfully!');
  
  if (!hasRealSupabase) {
    console.log('\n📝 Next steps:');
    console.log('1. Set up your Supabase project');
    console.log('2. Add real environment variables to .env.local');
    console.log('3. Deploy to Vercel with proper environment variables');
  }
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  
  console.log('\n🔧 Troubleshooting tips:');
  console.log('1. Make sure you have Node.js 20+ installed');
  console.log('2. Run "npm ci" to ensure clean dependencies');
  console.log('3. Check that all TypeScript files compile without errors');
  console.log('4. Verify environment variables are properly set');
  
  process.exit(1);
}