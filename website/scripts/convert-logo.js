#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const sizes = [
  { size: 400, name: 'icon-34.png' },
  { size: 800, name: 'icon-128.png' },
  { size: 48, name: 'favicon-48.png' },
];
const inputFile = path.join(__dirname, '../public/icon/logo.svg');
const outputDir = path.join(__dirname, '../app');

// Check if input file exists
if (!fs.existsSync(inputFile)) {
  console.error('❌ Error: logo.svg not found at', inputFile);
  process.exit(1);
}

// Check if rsvg-convert is available
try {
  execSync('which rsvg-convert', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Error: rsvg-convert not found. Please install it:');
  console.error('   brew install librsvg');
  process.exit(1);
}

// Check if ImageMagick is available for favicon.ico creation
let hasImageMagick = false;
try {
  execSync('which convert', { stdio: 'pipe' });
  hasImageMagick = true;
} catch (error) {
  console.warn('⚠️  Warning: ImageMagick not found. favicon.ico will not be created.');
  console.warn('   To create favicon.ico, install ImageMagick:');
  console.warn('   brew install imagemagick');
}

console.log('🎨 Converting SVG to PNG...\n');

sizes.forEach(({ size, name }) => {
  const outputFile = path.join(outputDir, name);

  try {
    const command = `rsvg-convert -w ${size} -h ${size} "${inputFile}" -o "${outputFile}"`;
    execSync(command, { stdio: 'inherit' });

    const stats = fs.statSync(outputFile);
    const fileSizeKB = (stats.size / 1024).toFixed(1);

    console.log(`✅ Created: ${name} (${size}x${size}, ${fileSizeKB}KB)`);
  } catch (error) {
    console.error(`❌ Failed to convert ${name}:`, error.message);
    process.exit(1);
  }
});

// Create favicon.ico from the PNG files
if (hasImageMagick) {
  console.log('\n🔄 Creating favicon.ico...\n');

  try {
    const faviconPngs = [
      path.join(outputDir, 'favicon-16.png'),
      path.join(outputDir, 'favicon-32.png'),
      path.join(outputDir, 'favicon-48.png'),
    ];

    const faviconOutput = path.join(outputDir, 'favicon.ico');
    const command = `convert ${faviconPngs.join(' ')} "${faviconOutput}"`;

    execSync(command, { stdio: 'inherit' });

    const stats = fs.statSync(faviconOutput);
    const fileSizeKB = (stats.size / 1024).toFixed(1);

    console.log(`✅ Created: favicon.ico (16x16, 32x32, 48x48, ${fileSizeKB}KB)`);

    // Clean up temporary favicon PNG files
    faviconPngs.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    console.log('🧹 Cleaned up temporary favicon PNG files');
  } catch (error) {
    console.error('❌ Failed to create favicon.ico:', error.message);
  }
}

console.log('\n🎉 All conversions completed successfully!');
