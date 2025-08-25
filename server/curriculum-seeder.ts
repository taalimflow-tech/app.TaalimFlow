import { db } from './db';
import { teachingModules } from '@shared/schema';
import { eq, isNull } from 'drizzle-orm';

// Standardized Algerian National Curriculum
export const ALGERIAN_CURRICULUM = {
  // 📘 Primary Education (التعليم الابتدائي) - Years 1-5
  primary: [
    { name: 'Arabic Language', nameAr: 'اللغة العربية' },
    { name: 'Islamic Education', nameAr: 'التربية الإسلامية' },
    { name: 'Civic Education', nameAr: 'التربية المدنية' },
    { name: 'Mathematics', nameAr: 'الرياضيات' },
    { name: 'French Language', nameAr: 'اللغة الفرنسية' },
    { name: 'Scientific and Technological Education', nameAr: 'التربية العلمية والتكنولوجية (علوم)' },
    { name: 'Arts Education', nameAr: 'التربية الفنية (تشكيلية + موسيقية)' },
    { name: 'Physical Education', nameAr: 'التربية البدنية والرياضية' },
    { name: 'Amazigh Language', nameAr: 'اللغة الأمازيغية (في بعض الولايات)' }
  ],

  // 📗 Middle School Education (التعليم المتوسط) - Years 1-4
  middle: [
    { name: 'Arabic Language', nameAr: 'اللغة العربية' },
    { name: 'Islamic Education', nameAr: 'التربية الإسلامية' },
    { name: 'Civic Education', nameAr: 'التربية المدنية' },
    { name: 'Mathematics', nameAr: 'الرياضيات' },
    { name: 'Natural Sciences', nameAr: 'العلوم الطبيعية' },
    { name: 'Physics and Technology', nameAr: 'العلوم الفيزيائية والتكنولوجيا' },
    { name: 'French Language', nameAr: 'اللغة الفرنسية' },
    { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
    { name: 'History', nameAr: 'التاريخ' },
    { name: 'Geography', nameAr: 'الجغرافيا' },
    { name: 'Computer Science', nameAr: 'الإعلام الآلي (مقرر محدود)' },
    { name: 'Arts Education', nameAr: 'التربية التشكيلية' },
    { name: 'Music Education', nameAr: 'التربية الموسيقية' },
    { name: 'Physical Education', nameAr: 'التربية البدنية' },
    { name: 'Amazigh Language', nameAr: 'اللغة الأمازيغية (في بعض الولايات)' }
  ],

  // 📕 Secondary Education (التعليم الثانوي) - Common Core (First Year)
  secondary: [
    { name: 'Arabic Language', nameAr: 'اللغة العربية' },
    { name: 'Islamic Education', nameAr: 'التربية الإسلامية' },
    { name: 'Civic Education', nameAr: 'التربية المدنية' },
    { name: 'Mathematics', nameAr: 'الرياضيات' },
    { name: 'Natural Sciences', nameAr: 'العلوم الطبيعية' },
    { name: 'Physics Sciences', nameAr: 'العلوم الفيزيائية' },
    { name: 'French Language', nameAr: 'اللغة الفرنسية' },
    { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
    { name: 'History and Geography', nameAr: 'التاريخ والجغرافيا' },
    { name: 'Philosophy', nameAr: 'الفلسفة (مقدمة بسيطة)' },
    { name: 'Computer Science', nameAr: 'الإعلام الآلي (أساسي)' },
    { name: 'Physical Education', nameAr: 'التربية البدنية' },
    { name: 'Arts Education', nameAr: 'التربية الفنية (في بعض التخصصات)' },
    { name: 'Amazigh Language', nameAr: 'اللغة الأمازيغية (حسب المناطق)' }
  ]
};

/**
 * Seeds the standardized Algerian curriculum for all schools
 */
export async function seedStandardizedCurriculum(): Promise<void> {
  console.log('🌱 Starting curriculum standardization...');

  // Get existing global subjects to avoid duplicates
  const existingModules = await db.select().from(teachingModules).where(isNull(teachingModules.schoolId));
  const existingNames = new Set(existingModules.map(m => `${m.nameAr}-${m.educationLevel}`));
  
  const modulesToInsert = [];

  // Primary Education (الابتدائي)
  for (const subject of ALGERIAN_CURRICULUM.primary) {
    const key = `${subject.nameAr}-الابتدائي`;
    if (!existingNames.has(key)) {
      modulesToInsert.push({
        schoolId: null, // Global subjects
        name: subject.name,
        nameAr: subject.nameAr,
        educationLevel: 'الابتدائي',
        grade: null, // No specific grade - applies to all primary years
        description: `${subject.nameAr} - التعليم الابتدائي`
      });
    }
  }

  // Middle School Education (المتوسط)
  for (const subject of ALGERIAN_CURRICULUM.middle) {
    const key = `${subject.nameAr}-المتوسط`;
    if (!existingNames.has(key)) {
      modulesToInsert.push({
        schoolId: null,
        name: subject.name,
        nameAr: subject.nameAr,
        educationLevel: 'المتوسط',
        grade: null, // No specific grade - applies to all middle years
        description: `${subject.nameAr} - التعليم المتوسط`
      });
    }
  }

  // Secondary Education (الثانوي)
  for (const subject of ALGERIAN_CURRICULUM.secondary) {
    const key = `${subject.nameAr}-الثانوي`;
    if (!existingNames.has(key)) {
      modulesToInsert.push({
        schoolId: null,
        name: subject.name,
        nameAr: subject.nameAr,
        educationLevel: 'الثانوي',
        grade: null, // No specific grade - common core subjects
        description: `${subject.nameAr} - التعليم الثانوي`
      });
    }
  }

  // Insert all modules in batches
  const batchSize = 50;
  for (let i = 0; i < modulesToInsert.length; i += batchSize) {
    const batch = modulesToInsert.slice(i, i + batchSize);
    await db.insert(teachingModules).values(batch);
  }

  console.log(`✅ Successfully seeded ${modulesToInsert.length} standardized curriculum subjects`);
}

/**
 * Ensures a specific school has access to all standardized subjects
 */
export async function ensureSchoolHasStandardizedCurriculum(schoolId: number): Promise<void> {
  console.log(`🏫 Ensuring school ${schoolId} has standardized curriculum...`);
  
  // This function can be called when a new school is created
  // The global subjects (schoolId = null) are already available to all schools
  // Individual schools can add their own custom subjects on top
  
  console.log(`✅ School ${schoolId} now has access to standardized curriculum`);
}

// Run the seeding function if this script is executed directly
seedStandardizedCurriculum()
  .then(() => {
    console.log('🎉 Curriculum seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error seeding curriculum:', error);
    process.exit(1);
  });