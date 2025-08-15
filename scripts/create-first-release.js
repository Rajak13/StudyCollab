#!/usr/bin/env node

/**
 * Script to help create the first release of StudyCollab Desktop
 * This script will guide you through the process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 StudyCollab Desktop Release Creator\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
    console.error('❌ Please run this script from the studycollab-mvp directory');
    process.exit(1);
}

// Check if git is initialized
try {
    execSync('git status', { stdio: 'ignore' });
} catch (error) {
    console.error('❌ This directory is not a git repository');
    process.exit(1);
}

// Get current version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;

console.log(`📦 Current version in package.json: ${currentVersion}`);

// Suggest version
const suggestedVersion = `v${currentVersion}`;
console.log(`💡 Suggested release version: ${suggestedVersion}`);

console.log('\n📋 Pre-release checklist:');
console.log('✅ Code is committed and pushed to GitHub');
console.log('✅ Environment variables are set (NEXT_PUBLIC_RELEASE_OWNER, NEXT_PUBLIC_RELEASE_REPO)');
console.log('✅ GitHub Actions are enabled in your repository');

console.log('\n🔧 What this script will do:');
console.log('1. Test build the application locally');
console.log('2. Create a git tag for the release');
console.log('3. Push the tag to trigger GitHub Actions');
console.log('4. GitHub Actions will build and create the release automatically');

console.log('\n⚠️  Make sure you have committed and pushed all your changes before proceeding!');

// Ask for confirmation
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\n❓ Do you want to proceed with creating the release? (y/N): ', (answer) => {
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ Release creation cancelled');
        rl.close();
        return;
    }

    rl.question(`\n📝 Enter version tag (default: ${suggestedVersion}): `, (version) => {
        const releaseVersion = version.trim() || suggestedVersion;

        // Ensure version starts with 'v'
        const finalVersion = releaseVersion.startsWith('v') ? releaseVersion : `v${releaseVersion}`;

        console.log(`\n🏗️  Creating release ${finalVersion}...`);

        try {
            // Step 1: Test build locally (optional, can be skipped if it takes too long)
            console.log('1️⃣ Testing local build...');
            console.log('   (This may take a few minutes)');

            try {
                execSync('npm run build', { stdio: 'inherit' });
                console.log('✅ Next.js build successful');

                execSync('npm run electron:compile', { stdio: 'inherit' });
                console.log('✅ Electron compilation successful');

                console.log('✅ Local build test passed');
            } catch (buildError) {
                console.log('⚠️  Local build test failed, but continuing with release...');
                console.log('   The GitHub Actions build might still succeed');
            }

            // Step 2: Create and push tag
            console.log('\n2️⃣ Creating git tag...');
            execSync(`git tag ${finalVersion}`, { stdio: 'inherit' });
            console.log(`✅ Created tag ${finalVersion}`);

            console.log('\n3️⃣ Pushing tag to GitHub...');
            execSync(`git push origin ${finalVersion}`, { stdio: 'inherit' });
            console.log(`✅ Pushed tag ${finalVersion} to GitHub`);

            console.log('\n🎉 Release creation initiated!');
            console.log('\n📍 Next steps:');
            console.log('1. Go to your GitHub repository: https://github.com/Rajak13/StudyCollab');
            console.log('2. Click on the "Actions" tab to watch the build progress');
            console.log('3. Once complete, check the "Releases" tab for your new release');
            console.log('4. Test the download button on your website');

            console.log('\n⏱️  The build process typically takes 10-15 minutes');
            console.log('💡 You can close this terminal - the build will continue on GitHub');

        } catch (error) {
            console.error('\n❌ Error creating release:', error.message);
            console.log('\n🔧 Troubleshooting:');
            console.log('- Make sure you have committed and pushed all changes');
            console.log('- Check that you have push access to the repository');
            console.log('- Verify the tag name is valid (e.g., v1.0.0)');
        }

        rl.close();
    });
});