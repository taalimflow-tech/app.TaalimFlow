#!/usr/bin/env node

/**
 * Simple Desktop Distribution Builder
 * Creates installable packages for Windows, macOS, and Linux
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

console.log('🏗️  School Management Desktop Builder');
console.log('====================================\n');

const platform = process.argv[2] || 'current';

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  try {
    // Check if electron-builder is available
    await runCommand('npx', ['electron-builder', '--version']);
    console.log('✅ electron-builder found');
  } catch {
    console.log('❌ electron-builder not found. Installing...');
    await runCommand('npm', ['install', 'electron-builder', '--save-dev']);
  }
  
  console.log();
}

async function buildWeb() {
  console.log('📦 Building web application...');
  
  try {
    await runCommand('npm', ['run', 'build']);
    console.log('✅ Web build complete');
  } catch (error) {
    console.error('❌ Web build failed:', error.message);
    console.log('\n💡 Tip: Make sure all dependencies are installed with: npm install');
    process.exit(1);
  }
  
  console.log();
}

async function buildDesktop() {
  console.log('🖥️  Building desktop application...');
  
  const builderArgs = ['electron-builder'];
  
  switch (platform.toLowerCase()) {
    case 'win':
    case 'windows':
      builderArgs.push('--win');
      console.log('🪟 Target: Windows (.exe, .msi)');
      break;
    case 'mac':
    case 'macos':
      builderArgs.push('--mac');
      console.log('🍎 Target: macOS (.dmg)');
      break;
    case 'linux':
      builderArgs.push('--linux');
      console.log('🐧 Target: Linux (.AppImage, .deb)');
      break;
    case 'all':
      console.log('🌍 Target: All platforms');
      break;
    default:
      console.log(`🖥️  Target: Current platform (${process.platform})`);
      break;
  }
  
  builderArgs.push('--publish=never');
  
  try {
    await runCommand('npx', builderArgs);
    console.log('✅ Desktop build complete');
  } catch (error) {
    console.error('❌ Desktop build failed:', error.message);
    
    if (error.message.includes('icon')) {
      console.log('\n💡 Tip: Generate icons first with: node electron/assets/build-icons.js');
    }
    
    process.exit(1);
  }
  
  console.log();
}

async function showResults() {
  console.log('📁 Distribution files created in: desktop-dist/');
  
  try {
    const distDir = 'desktop-dist';
    const files = await fs.readdir(distDir);
    
    console.log('\n📋 Available installers:');
    
    for (const file of files) {
      const stat = await fs.stat(path.join(distDir, file));
      if (stat.isFile()) {
        const sizeInMB = (stat.size / 1024 / 1024).toFixed(1);
        
        if (file.endsWith('.exe')) {
          console.log(`   🪟 ${file} (${sizeInMB} MB) - Windows installer`);
        } else if (file.endsWith('.dmg')) {
          console.log(`   🍎 ${file} (${sizeInMB} MB) - macOS installer`);
        } else if (file.endsWith('.AppImage')) {
          console.log(`   🐧 ${file} (${sizeInMB} MB) - Linux portable app`);
        } else if (file.endsWith('.deb')) {
          console.log(`   🐧 ${file} (${sizeInMB} MB) - Debian/Ubuntu package`);
        } else if (file.endsWith('.rpm')) {
          console.log(`   🐧 ${file} (${sizeInMB} MB) - Red Hat/SUSE package`);
        } else if (file.endsWith('.msi')) {
          console.log(`   🪟 ${file} (${sizeInMB} MB) - Windows MSI package`);
        }
      }
    }
    
  } catch (error) {
    console.log('   (Could not list files - check desktop-dist/ folder manually)');
  }
  
  console.log('\n🎉 Desktop distribution build complete!');
  console.log('\n📖 Installation guide:');
  console.log('   • Windows: Run the .exe file to install');
  console.log('   • macOS: Open the .dmg and drag to Applications folder');
  console.log('   • Linux: Install .deb/.rpm or run .AppImage directly');
}

async function main() {
  try {
    await checkPrerequisites();
    await buildWeb();
    await buildDesktop();
    await showResults();
    
  } catch (error) {
    console.error('\n❌ Build process failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Ensure Node.js 18+ is installed');
    console.log('   • Run: npm install');
    console.log('   • Check: BUILD_DESKTOP.md for detailed instructions');
    process.exit(1);
  }
}

// Handle command line help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node build-desktop.js [platform]');
  console.log('');
  console.log('Platforms:');
  console.log('  current    Build for current platform (default)');
  console.log('  windows    Build Windows installers');
  console.log('  mac        Build macOS installer');
  console.log('  linux      Build Linux packages');
  console.log('  all        Build for all platforms');
  console.log('');
  console.log('Examples:');
  console.log('  node build-desktop.js');
  console.log('  node build-desktop.js windows');
  console.log('  node build-desktop.js all');
  process.exit(0);
}

main();