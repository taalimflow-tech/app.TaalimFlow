const { Pool } = require('pg');

async function replaceTeachingModules() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Starting teaching modules replacement...');
    
    await pool.query('BEGIN');
    
    // First check if table exists, if not create basic structure
    try {
      await pool.query('SELECT 1 FROM "teachingModules" LIMIT 1');
      console.log('🗑️ Table exists, clearing existing teaching modules...');
      await pool.query('DELETE FROM "teachingModules"');
    } catch (err) {
      console.log('📋 Creating teachingModules table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "teachingModules" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR NOT NULL,
          "nameAr" VARCHAR NOT NULL,
          "educationLevel" VARCHAR NOT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW()
        )
      `);
    }
    
    // Insert the new standardized modules
    console.log('📚 Inserting standardized subjects...');
    
    const subjects = [
      // الابتدائي (Primary Level)
      ['العربية والرياضيات', 'العربية والرياضيات', 'الابتدائي'],
      ['اللغة الإنجليزية', 'اللغة الإنجليزية', 'الابتدائي'],
      ['اللغة الفرنسية', 'اللغة الفرنسية', 'الابتدائي'],
      
      // المتوسط (Middle Level) 
      ['اللغة العربية', 'اللغة العربية', 'المتوسط'],
      ['اللغة الإنجليزية', 'اللغة الإنجليزية', 'المتوسط'],
      ['اللغة الفرنسية', 'اللغة الفرنسية', 'المتوسط'],
      ['التاريخ والجغرافيا', 'التاريخ والجغرافيا', 'المتوسط'],
      ['الرياضيات', 'الرياضيات', 'المتوسط'],
      ['العلوم الطبيعية', 'العلوم الطبيعية', 'المتوسط'],
      ['الفيزياء', 'الفيزياء', 'المتوسط'],
      
      // الثانوي (Secondary Level)
      ['اللغة العربية وآدابها', 'اللغة العربية وآدابها', 'الثانوي'],
      ['اللغة الإنجليزية', 'اللغة الإنجليزية', 'الثانوي'],
      ['اللغة الفرنسية', 'اللغة الفرنسية', 'الثانوي'],
      ['اللغة الألمانية', 'اللغة الألمانية', 'الثانوي'],
      ['اللغة الإسبانية', 'اللغة الإسبانية', 'الثانوي'],
      ['اللغة الأمازيغية', 'اللغة الأمازيغية', 'الثانوي'],
      ['الرياضيات', 'الرياضيات', 'الثانوي'],
      ['العلوم الطبيعية والحياة', 'العلوم الطبيعية والحياة', 'الثانوي'],
      ['العلوم الفيزيائية', 'العلوم الفيزيائية', 'الثانوي'],
      ['التاريخ والجغرافيا', 'التاريخ والجغرافيا', 'الثانوي'],
      ['الفلسفة', 'الفلسفة', 'الثانوي'],
      ['التربية الإسلامية', 'التربية الإسلامية', 'الثانوي'],
      ['الإعلام الآلي', 'الإعلام الآلي', 'الثانوي'],
      ['الاقتصاد والمناجمنت', 'الاقتصاد والمناجمنت', 'الثانوي'],
      ['القانون', 'القانون', 'الثانوي'],
      ['المحاسبة', 'المحاسبة', 'الثانوي'],
      ['الهندسة الكهربائية', 'الهندسة الكهربائية', 'الثانوي'],
      ['الهندسة المدنية', 'الهندسة المدنية', 'الثانوي'],
      ['الهندسة الميكانيكية', 'الهندسة الميكانيكية', 'الثانوي']
    ];

    for (const [name, nameAr, educationLevel] of subjects) {
      await pool.query(
        'INSERT INTO "teachingModules" (name, "nameAr", "educationLevel", "createdAt") VALUES ($1, $2, $3, NOW())',
        [name, nameAr, educationLevel]
      );
    }
    
    await pool.query('COMMIT');
    
    console.log(`✅ Successfully replaced teaching modules with ${subjects.length} standardized subjects:`);
    console.log('🎯 Primary (الابتدائي): 3 subjects');
    console.log('🎯 Middle (المتوسط): 7 subjects'); 
    console.log('🎯 Secondary (الثانوي): 19 subjects');
    console.log('📊 Total: 29 standardized subjects');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Failed to replace teaching modules:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

replaceTeachingModules().catch(console.error);