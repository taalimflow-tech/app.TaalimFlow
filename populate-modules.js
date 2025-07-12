#!/usr/bin/env node

// Script to populate the database with teaching modules for the Algerian education system
// Run this with: node populate-modules.js

const { modules } = require('./seed-modules.js');

async function populateModules() {
  console.log('🎓 Populating teaching modules for Algerian education system...');
  console.log(`📚 Total modules to add: ${modules.length}`);
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (const module of modules) {
    try {
      const response = await fetch('http://localhost:5000/api/admin/teaching-modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(module),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Added: ${module.nameAr} (${module.educationLevel} - ${module.grade})`);
        successCount++;
      } else {
        const error = await response.json();
        console.log(`❌ Failed: ${module.nameAr} - ${error.error || 'Unknown error'}`);
        errorCount++;
      }
    } catch (error) {
      console.log(`❌ Network error for ${module.nameAr}: ${error.message}`);
      errorCount++;
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('');
  console.log('📊 Summary:');
  console.log(`✅ Successfully added: ${successCount} modules`);
  console.log(`❌ Failed: ${errorCount} modules`);
  console.log(`📈 Success rate: ${((successCount / modules.length) * 100).toFixed(1)}%`);
  
  if (errorCount > 0) {
    console.log('');
    console.log('⚠️  Some modules failed to add. This might be due to:');
    console.log('   - Server not running (make sure to start with npm run dev)');
    console.log('   - Authentication issues (admin login required)');
    console.log('   - Database connection issues');
    console.log('   - Duplicate modules (already exist in database)');
  }
}

// Run the population script
populateModules().catch(console.error);