#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 School Management Desktop Packager\n');

const platform = process.argv[2] || 'current';

function runElectronBuilder(target) {
  return new Promise((resolve, reject) => {
    const args = ['electron-builder'];
    
    switch (target) {
      case 'win':
      case 'windows':
        args.push('--win', '--x64', '--ia32');
        console.log('🪟 Building Windows installers (.exe, .msi)...');
        break;
      case 'mac':
      case 'macos':
        args.push('--mac', '--x64', '--arm64');
        console.log('🍎 Building macOS installer (.dmg)...');
        break;
      case 'linux':
        args.push('--linux', '--x64');
        console.log('🐧 Building Linux packages (.AppImage, .deb)...');
        break;
      case 'current':
        console.log(`🖥️  Building for current platform (${process.platform})...`);
        break;
      default:
        console.log('🌍 Building for all platforms...');
        break;
    }
    
    args.push('--publish=never');
    
    const builder = spawn('npx', args, {
      stdio: 'inherit',
      shell: true,
      cwd: path.resolve(__dirname, '../..')
    });

    builder.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ Build complete for ${target}!`);
        console.log('📁 Check the desktop-dist/ folder for installers\n');
        
        // Show what was built
        console.log('📋 Built packages:');
        switch (target) {
          case 'win':
          case 'windows':
            console.log('  • Windows Installer (.exe)');
            console.log('  • Windows Portable (.exe)');
            console.log('  • Windows Setup (.msi)');
            break;
          case 'mac':
          case 'macos':
            console.log('  • macOS Disk Image (.dmg)');
            console.log('  • macOS Application Bundle (.app)');
            break;
          case 'linux':
            console.log('  • AppImage (.AppImage)');
            console.log('  • Debian Package (.deb)');
            console.log('  • RPM Package (.rpm)');
            break;
        }
        
        resolve(code);
      } else {
        reject(new Error(`Build failed with exit code ${code}`));
      }
    });

    builder.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  try {
    console.log('🔨 Preparing build environment...\n');
    
    // Check if dist folder exists (web build should be done first)
    try {
      await import('fs').then(fs => fs.promises.access('dist'));
      console.log('✅ Web build found\n');
    } catch {
      console.log('❌ Web build not found. Please run: npm run build');
      console.log('   Or use the full build script: node electron/scripts/build.js\n');
      process.exit(1);
    }
    
    await runElectronBuilder(platform);
    
    console.log('🎉 Packaging complete!');
    console.log('\n📖 Installation Guide:');
    console.log('  Windows: Run the .exe installer');
    console.log('  macOS: Open the .dmg and drag to Applications');
    console.log('  Linux: Install the .deb/.rpm or run the .AppImage directly');
    
  } catch (error) {
    console.error('❌ Packaging failed:', error.message);
    process.exit(1);
  }
}

main();