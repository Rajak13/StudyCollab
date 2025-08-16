const fs = require('fs');
const path = require('path');

/**
 * Generate proper ICO files for the desktop application
 * This script creates a simple ICO file structure to fix the "unknown format" error
 */

console.log('Generating proper ICO files...');

// Create a simple ICO file structure
// ICO files need to have a specific header format and contain multiple image sizes
function createSimpleIcoFile(outputPath) {
  // This is a minimal valid ICO file structure
  // It contains 16x16, 32x32, and 256x256 icons (simplified)
  
  const icoHeader = Buffer.from([
    // ICO file header
    0x00, 0x00,           // Reserved
    0x01, 0x00,           // Type (1 = ICO)
    0x03, 0x00,           // Number of images (3)
    
    // First image directory entry (16x16)
    0x10,                 // Width
    0x10,                 // Height
    0x00,                 // Color count
    0x00,                 // Reserved
    0x01, 0x00,           // Color planes
    0x04, 0x00,           // Bits per pixel
    0x40, 0x00, 0x00, 0x00, // Size of image data
    0x16, 0x00, 0x00, 0x00, // Offset to image data
    
    // Second image directory entry (32x32)
    0x20,                 // Width
    0x20,                 // Height
    0x00,                 // Color count
    0x00,                 // Reserved
    0x01, 0x00,           // Color planes
    0x04, 0x00,           // Bits per pixel
    0x00, 0x04, 0x00, 0x00, // Size of image data
    0x56, 0x00, 0x00, 0x00, // Offset to image data
    
    // Third image directory entry (256x256)
    0x00,                 // Width (0 = 256)
    0x00,                 // Height (0 = 256)
    0x00,                 // Color count
    0x00,                 // Reserved
    0x01, 0x00,           // Color planes
    0x04, 0x00,           // Bits per pixel
    0x00, 0x00, 0x04, 0x00, // Size of image data
    0x56, 0x04, 0x00, 0x00, // Offset to image data
  ]);
  
  // Create simple 16x16 RGBA data (64 bytes)
  const icon16x16 = Buffer.alloc(64);
  // Fill with a simple blue color (RGBA format)
  for (let i = 0; i < 64; i += 4) {
    icon16x16[i] = 0x3B;     // R (59)
    icon16x16[i + 1] = 0x82; // G (130)
    icon16x16[i + 2] = 0xF6; // B (246)
    icon16x16[i + 3] = 0xFF; // A (255)
  }
  
  // Create simple 32x32 RGBA data (4096 bytes)
  const icon32x32 = Buffer.alloc(4096);
  // Fill with the same blue color
  for (let i = 0; i < 4096; i += 4) {
    icon32x32[i] = 0x3B;     // R (59)
    icon32x32[i + 1] = 0x82; // G (130)
    icon32x32[i + 2] = 0xF6; // B (246)
    icon32x32[i + 3] = 0xFF; // A (255)
  }
  
  // Create simple 256x256 RGBA data (262144 bytes)
  const icon256x256 = Buffer.alloc(262144);
  // Fill with the same blue color
  for (let i = 0; i < 262144; i += 4) {
    icon256x256[i] = 0x3B;     // R (59)
    icon256x256[i + 1] = 0x82; // G (130)
    icon256x256[i + 2] = 0xF6; // B (246)
    icon256x256[i + 3] = 0xFF; // A (255)
  }
  
  // Combine all parts
  const icoFile = Buffer.concat([icoHeader, icon16x16, icon32x32, icon256x256]);
  
  // Write the file
  fs.writeFileSync(outputPath, icoFile);
  console.log(`Created ICO file: ${outputPath} (${icoFile.length} bytes)`);
}

// Generate all required ICO files
const assetsDir = path.join(__dirname, '..', 'assets');

// Main icon
createSimpleIcoFile(path.join(assetsDir, 'icon.ico'));

// Note icon
createSimpleIcoFile(path.join(assetsDir, 'note-icon.ico'));

// Task icon
createSimpleIcoFile(path.join(assetsDir, 'task-icon.ico'));

// Board icon
createSimpleIcoFile(path.join(assetsDir, 'board-icon.ico'));

// Tray icon (smaller size)
createSimpleIcoFile(path.join(assetsDir, 'tray-icon.ico'));

console.log('✅ All ICO files generated successfully!');
console.log('You can now run: npm run electron:dist');
