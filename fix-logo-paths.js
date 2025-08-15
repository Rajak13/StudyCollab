/**
 * Fix incorrect logo paths in branding configuration
 * Run this script to correct the logo paths stored in localStorage
 */

// This script should be run in the browser console on your admin branding page

console.log('Fixing logo paths...');

// Get current branding config from localStorage
const currentConfig = localStorage.getItem('branding-config');
if (currentConfig) {
  try {
    const config = JSON.parse(currentConfig);
    console.log('Current config:', config);
    
    // Fix any incorrect paths
    if (config.assets) {
      Object.keys(config.assets).forEach(key => {
        const path = config.assets[key];
        if (path && path.includes('studycollab-mvp/public/')) {
          // Extract just the filename and make it a root path
          const filename = path.split('/').pop();
          config.assets[key] = `/${filename}`;
          console.log(`Fixed ${key}: ${path} -> /${filename}`);
        }
      });
    }
    
    // Save the corrected config
    localStorage.setItem('branding-config', JSON.stringify(config));
    console.log('Fixed config saved:', config);
    
    // Reload the page to apply changes
    window.location.reload();
  } catch (error) {
    console.error('Error fixing config:', error);
  }
} else {
  console.log('No branding config found in localStorage');
}