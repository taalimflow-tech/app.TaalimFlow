#!/usr/bin/env node

/**
 * Generate the correct QR code for the child to verify format
 */

console.log('🔍 Child QR Code Verification');
console.log('============================');
console.log('');
console.log('Based on database data:');
console.log('- Child ID: 3');
console.log('- School ID: 8 (school name: "last")');
console.log('- Status: verified');
console.log('');
console.log('✅ Correct QR Code should be:');
console.log('child-3-8-verified');
console.log('');
console.log('🎯 Please scan this exact QR code:');
console.log('');
console.log('┌─────────────────────────────┐');
console.log('│      child-3-8-verified     │');
console.log('└─────────────────────────────┘');
console.log('');
console.log('If this still fails, check:');
console.log('1. You are logged into "last" school');
console.log('2. Browser console for debug logs');
console.log('3. Server logs for backend debugging');