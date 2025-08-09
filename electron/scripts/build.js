#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const buildType = args[0] || 'all';

console.log('🏗️  School Management Desktop Builder\n');

// Function to run a command and return a promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
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

async function buildWeb() {
  console.log('📦 Building web application...');
  await runCommand('npm', ['run', 'build']);
  console.log('✅ Web build complete!\n');
}

async function buildElectron(platform) {
  console.log(`🖥️  Building desktop application for ${platform}...`);
  
  const builderArgs = ['run', 'electron-builder'];
  
  switch (platform) {
    case 'win':
    case 'windows':
      builderArgs.push('--win');
      break;
    case 'mac':
    case 'macos':
      builderArgs.push('--mac');
      break;
    case 'linux':
      builderArgs.push('--linux');
      break;
    default:
      // Build for all platforms
      break;
  }
  
  builderArgs.push('--publish=never');
  
  await runCommand('npx', builderArgs);
  console.log(`✅ Desktop build for ${platform} complete!\n`);
}

async function createBuildInfo() {
  const buildInfo = {
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    platform: process.platform,
    node: process.version,
    description: 'School Management System Desktop Application'
  };
  
  await fs.writeFile('dist/build-info.json', JSON.stringify(buildInfo, null, 2));
  console.log('📋 Build info created\n');
}

async function main() {
  try {
    // Always build web first
    await buildWeb();
    await createBuildInfo();
    
    switch (buildType) {
      case 'win':
      case 'windows':
        await buildElectron('win');
        break;
      case 'mac':
      case 'macos':
        await buildElectron('mac');
        break;
      case 'linux':
        await buildElectron('linux');
        break;
      case 'all':
      default:
        console.log('🌍 Building for all platforms...\n');
        await buildElectron('win');
        await buildElectron('mac');
        await buildElectron('linux');
        break;
    }
    
    console.log('🎉 All builds complete!');
    console.log('📁 Distributables are in the desktop-dist/ folder');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();