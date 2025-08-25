#!/usr/bin/env node

/**
 * Verification script for Electron configuration
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Verifying Electron configuration...\n')

// Check if required files exist
const requiredFiles = [
  'next.config.ts',
  'src/lib/electron.ts',
  'src/components/electron/ElectronProvider.tsx',
  'src/hooks/useElectronFeatures.ts',
  'docs/ELECTRON_INTEGRATION.md'
]

let allFilesExist = true

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`)
  } else {
    console.log(`❌ ${file} missing`)
    allFilesExist = false
  }
})

// Check package.json for required scripts
const packageJsonPath = path.join(__dirname, '..', 'package.json')
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  
  const requiredScripts = [
    'build:electron',
    'electron:dev',
    'electron:build',
    'dist',
    'dist:win',
    'dist:mac',
    'dist:linux'
  ]
  
  console.log('\n📦 Checking package.json scripts:')
  requiredScripts.forEach(script => {
    if (packageJson.scripts[script]) {
      console.log(`✅ ${script}: ${packageJson.scripts[script]}`)
    } else {
      console.log(`❌ ${script} missing`)
      allFilesExist = false
    }
  })
  
  // Check for required dependencies
  const requiredDeps = ['cross-env', 'electron', 'electron-builder', 'concurrently', 'wait-on']
  console.log('\n📚 Checking dependencies:')
  requiredDeps.forEach(dep => {
    if (packageJson.devDependencies[dep] || packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} installed`)
    } else {
      console.log(`❌ ${dep} missing`)
      allFilesExist = false
    }
  })
}

// Check Next.js config
const nextConfigPath = path.join(__dirname, '..', 'next.config.ts')
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8')
  
  console.log('\n⚙️  Checking Next.js configuration:')
  
  const checks = [
    { name: 'Electron environment detection', pattern: /NEXT_PUBLIC_ELECTRON/ },
    { name: 'Asset prefix configuration', pattern: /assetPrefix.*isElectronBuild/ },
    { name: 'Webpack externals for Electron', pattern: /electron.*commonjs/ },
    { name: 'Module fallbacks', pattern: /fallback/ },
    { name: 'Content Security Policy', pattern: /Content-Security-Policy/ }
  ]
  
  checks.forEach(check => {
    if (check.pattern.test(nextConfig)) {
      console.log(`✅ ${check.name} configured`)
    } else {
      console.log(`❌ ${check.name} missing`)
      allFilesExist = false
    }
  })
}

console.log('\n' + '='.repeat(50))
if (allFilesExist) {
  console.log('🎉 All Electron configuration checks passed!')
  console.log('\nNext steps:')
  console.log('1. Run "npm run build:electron" to test the build')
  console.log('2. Run "npm run electron:dev" to test development mode')
  console.log('3. Implement Electron main process (Task 3)')
} else {
  console.log('❌ Some configuration issues found. Please review the missing items above.')
  process.exit(1)
}