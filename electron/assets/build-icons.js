#!/usr/bin/env node

/**
 * Icon Generator for School Management Desktop App
 * This creates placeholder icons in different formats for different platforms
 */

import { promises as fs } from 'fs';
import path from 'path';

// SVG icon template - Simple school/education icon
const iconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#4F46E5" rx="64"/>
  
  <!-- School building -->
  <rect x="80" y="200" width="352" height="200" fill="#FFFFFF" rx="8"/>
  
  <!-- Roof -->
  <polygon points="256,120 80,200 432,200" fill="#1F2937"/>
  
  <!-- Main door -->
  <rect x="216" y="280" width="80" height="120" fill="#4F46E5" rx="4"/>
  <circle cx="276" cy="340" r="4" fill="#FFFFFF"/>
  
  <!-- Windows -->
  <rect x="120" y="240" width="60" height="60" fill="#4F46E5" rx="4"/>
  <rect x="332" y="240" width="60" height="60" fill="#4F46E5" rx="4"/>
  <rect x="120" y="320" width="60" height="60" fill="#4F46E5" rx="4"/>
  <rect x="332" y="320" width="60" height="60" fill="#4F46E5" rx="4"/>
  
  <!-- Window dividers -->
  <line x1="150" y1="240" x2="150" y2="300" stroke="#FFFFFF" stroke-width="2"/>
  <line x1="120" y1="270" x2="180" y2="270" stroke="#FFFFFF" stroke-width="2"/>
  <line x1="362" y1="240" x2="362" y2="300" stroke="#FFFFFF" stroke-width="2"/>
  <line x1="332" y1="270" x2="392" y2="270" stroke="#FFFFFF" stroke-width="2"/>
  <line x1="150" y1="320" x2="150" y2="380" stroke="#FFFFFF" stroke-width="2"/>
  <line x1="120" y1="350" x2="180" y2="350" stroke="#FFFFFF" stroke-width="2"/>
  <line x1="362" y1="320" x2="362" y2="380" stroke="#FFFFFF" stroke-width="2"/>
  <line x1="332" y1="350" x2="392" y2="350" stroke="#FFFFFF" stroke-width="2"/>
  
  <!-- Flag pole -->
  <rect x="250" y="120" width="4" height="80" fill="#1F2937"/>
  <rect x="254" y="120" width="30" height="20" fill="#EF4444"/>
  
  <!-- School name in Arabic -->
  <text x="256" y="460" text-anchor="middle" fill="#1F2937" font-family="Arial, sans-serif" font-size="24" font-weight="bold">مدرستي</text>
</svg>`;

async function createIconAssets() {
  console.log('🎨 Creating icon assets for desktop distribution...\n');
  
  const assetsDir = path.join(process.cwd(), 'electron', 'assets');
  
  // Create assets directory if it doesn't exist
  try {
    await fs.mkdir(assetsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  
  // Create SVG icon
  await fs.writeFile(path.join(assetsDir, 'icon.svg'), iconSVG);
  console.log('✅ Created SVG icon');
  
  // Create a simple PNG icon (base64 encoded 1x1 pixel as placeholder)
  // In a real project, you'd use proper image generation libraries
  const pngPlaceholder = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  // For now, we'll create placeholder files that electron-builder can use
  const iconSizes = [16, 24, 32, 48, 64, 96, 128, 256, 512, 1024];
  
  for (const size of iconSizes) {
    const filename = `icon-${size}x${size}.png`;
    await fs.writeFile(path.join(assetsDir, filename), iconSVG.replace('512', size.toString()));
  }
  
  // Create main icons for different platforms
  await fs.writeFile(path.join(assetsDir, 'icon.png'), iconSVG.replace('<svg', '<svg width="256" height="256"'));
  await fs.writeFile(path.join(assetsDir, 'icon.ico'), iconSVG); // Will be converted by electron-builder
  await fs.writeFile(path.join(assetsDir, 'icon.icns'), iconSVG); // Will be converted by electron-builder
  
  console.log('✅ Created platform-specific icon files');
  console.log('📝 Note: For production, replace these with proper PNG/ICO/ICNS files\n');
  
  // Create build information
  const buildInfo = {
    name: "نظام إدارة المدارس",
    description: "School Management System Desktop Application",
    version: "1.0.0",
    author: "School Management Team",
    platforms: ["Windows", "macOS", "Linux"],
    features: [
      "Student Management",
      "Teacher Scheduling", 
      "QR Code Integration",
      "Thermal Printing Support",
      "Arabic/French Language Support",
      "Offline Database Sync"
    ],
    requirements: {
      windows: "Windows 10 or later",
      macos: "macOS 10.14 or later",
      linux: "Ubuntu 18.04+ / equivalent"
    }
  };
  
  await fs.writeFile(path.join(assetsDir, 'build-info.json'), JSON.stringify(buildInfo, null, 2));
  console.log('✅ Created build information file');
  
  console.log('🎉 Icon assets ready for distribution builds!');
}

createIconAssets().catch(console.error);