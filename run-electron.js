#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting School Management Desktop App...\n');

// Start the web server first
console.log('📡 Starting web server...');
const webServer = spawn('npm', ['run', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

webServer.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('🌐 Web:', output.trim());
  
  // Check if server is ready (look for the port message)
  if (output.includes('serving on port 5000')) {
    console.log('\n⚡ Web server ready! Starting Electron...\n');
    
    // Start Electron after a short delay
    setTimeout(() => {
      const electron = spawn('npx', ['electron', 'electron/main.js'], {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, NODE_ENV: 'development' }
      });

      electron.on('close', (code) => {
        console.log('\n🏁 Electron closed with code:', code);
        webServer.kill();
        process.exit(code);
      });
    }, 2000);
  }
});

webServer.stderr.on('data', (data) => {
  console.error('🌐 Web Error:', data.toString().trim());
});

webServer.on('close', (code) => {
  console.log('\n🏁 Web server closed with code:', code);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  webServer.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  webServer.kill();
  process.exit(0);
});