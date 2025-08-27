const { drizzle } = require('drizzle-orm/neon-serverless');
const { Pool } = require('@neondatabase/serverless');
const { teachingModules, teacherSpecializations } = require('../shared/schema.ts');

async function replaceTeachingModules() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const standardizedModules = [
    // الابتدائي (Primary Level)
    { name: 'العربية والرياضيات', nameAr: 'العربية والرياضيات', educationLevel: 'الابتدائي' },
    { name: 'اللغة الإنجليزية', nameAr: 'اللغة الإنجليزية', educationLevel: 'الابتدائي' },
    { name: 'اللغة الفرنسية', nameAr: 'اللغة الفرنسية', educationLevel: 'الابتدائي' },

    // المتوسط (Middle Level)
    { name: 'اللغة العربية', nameAr: 'اللغة العربية', educationLevel: 'المتوسط' },
    { name: 'اللغة الإنجليزية', nameAr: 'اللغة الإنجليزية', educationLevel: 'المتوسط' },
    { name: 'اللغة الفرنسية', nameAr: 'اللغة الفرنسية', educationLevel: 'المتوسط' },
    { name: 'التاريخ والجغرافيا', nameAr: 'التاريخ والجغرافيا', educationLevel: 'المتوسط' },
    { name: 'الرياضيات', nameAr: 'الرياضيات', educationLevel: 'المتوسط' },
    { name: 'العلوم الطبيعية', nameAr: 'العلوم الطبيعية', educationLevel: 'المتوسط' },
    { name: 'الفيزياء', nameAr: 'الفيزياء', educationLevel: 'المتوسط' },

    // الثانوي (Secondary Level)
    { name: 'اللغة العربية وآدابها', nameAr: 'اللغة العربية وآدابها', educationLevel: 'الثانوي' },
    { name: 'اللغة الإنجليزية', nameAr: 'اللغة الإنجليزية', educationLevel: 'الثانوي' },
    { name: 'اللغة الفرنسية', nameAr: 'اللغة الفرنسية', educationLevel: 'الثانوي' },
    { name: 'اللغة الألمانية', nameAr: 'اللغة الألمانية', educationLevel: 'الثانوي' },
    { name: 'اللغة الإسبانية', nameAr: 'اللغة الإسبانية', educationLevel: 'الثانوي' },
    { name: 'اللغة الأمازيغية', nameAr: 'اللغة الأمازيغية', educationLevel: 'الثانوي' },
    { name: 'الرياضيات', nameAr: 'الرياضيات', educationLevel: 'الثانوي' },
    { name: 'العلوم الطبيعية والحياة', nameAr: 'العلوم الطبيعية والحياة', educationLevel: 'الثانوي' },
    { name: 'العلوم الفيزيائية', nameAr: 'العلوم الفيزيائية', educationLevel: 'الثانوي' },
    { name: 'التاريخ والجغرافيا', nameAr: 'التاريخ والجغرافيا', educationLevel: 'الثانوي' },
    { name: 'الفلسفة', nameAr: 'الفلسفة', educationLevel: 'الثانوي' },
    { name: 'التربية الإسلامية', nameAr: 'التربية الإسلامية', educationLevel: 'الثانوي' },
    { name: 'الإعلام الآلي', nameAr: 'الإعلام الآلي', educationLevel: 'الثانوي' },
    { name: 'الاقتصاد والمناجمنت', nameAr: 'الاقتصاد والمناجمنت', educationLevel: 'الثانوي' },
    { name: 'القانون', nameAr: 'القانون', educationLevel: 'الثانوي' },
    { name: 'المحاسبة', nameAr: 'المحاسبة', educationLevel: 'الثانوي' },
    { name: 'الهندسة الكهربائية', nameAr: 'الهندسة الكهربائية', educationLevel: 'الثانوي' },
    { name: 'الهندسة المدنية', nameAr: 'الهندسة المدنية', educationLevel: 'الثانوي' },
    { name: 'الهندسة الميكانيكية', nameAr: 'الهندسة الميكانيكية', educationLevel: 'الثانوي' }
  ];

  try {
    await db.transaction(async (tx) => {
      console.log('🗑️ Deleting existing teacher specializations...');
      await tx.delete(teacherSpecializations);
      
      console.log('🗑️ Deleting existing teaching modules...');
      await tx.delete(teachingModules);
      
      console.log(`📚 Inserting ${standardizedModules.length} standardized subjects...`);
      if (standardizedModules.length > 0) {
        await tx.insert(teachingModules).values(standardizedModules);
      }
    });

    console.log(`✅ Successfully replaced teaching modules with ${standardizedModules.length} standardized subjects`);
    console.log('🎯 Primary (الابتدائي): 3 subjects');
    console.log('🎯 Middle (المتوسط): 7 subjects');
    console.log('🎯 Secondary (الثانوي): 19 subjects');
    
  } catch (error) {
    console.error('❌ Failed to replace teaching modules:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

replaceTeachingModules().catch(console.error);