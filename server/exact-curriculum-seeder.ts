import { db } from './db.js';
import { teachingModules } from '../shared/schema.js';

const exactCurriculum = [
  // الابتدائي (Primary Level) - EXACTLY 3 subjects
  {
    name: 'Arabic Math Combined',
    nameAr: 'العربية والرياضيات',
    educationLevel: 'الابتدائي',
    grades: ['الأولى ابتدائي', 'الثانية ابتدائي', 'الثالثة ابتدائي', 'الرابعة ابتدائي', 'الخامسة ابتدائي', 'جميع المستويات']
  },
  {
    name: 'English',
    nameAr: 'اللغة الإنجليزية',
    educationLevel: 'الابتدائي',
    grades: ['الأولى ابتدائي', 'الثانية ابتدائي', 'الثالثة ابتدائي', 'الرابعة ابتدائي', 'الخامسة ابتدائي', 'جميع المستويات']
  },
  {
    name: 'French',
    nameAr: 'اللغة الفرنسية',
    educationLevel: 'الابتدائي',
    grades: ['الثانية ابتدائي', 'الثالثة ابتدائي', 'الرابعة ابتدائي', 'الخامسة ابتدائي', 'جميع المستويات']
  },

  // المتوسط (Middle Level) - EXACTLY 7 subjects
  {
    name: 'Arabic',
    nameAr: 'اللغة العربية',
    educationLevel: 'المتوسط',
    grades: ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط', 'جميع المستويات']
  },
  {
    name: 'English',
    nameAr: 'اللغة الإنجليزية',
    educationLevel: 'المتوسط',
    grades: ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط', 'جميع المستويات']
  },
  {
    name: 'French',
    nameAr: 'اللغة الفرنسية',
    educationLevel: 'المتوسط',
    grades: ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط', 'جميع المستويات']
  },
  {
    name: 'History Geography',
    nameAr: 'التاريخ والجغرافيا',
    educationLevel: 'المتوسط',
    grades: ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط', 'جميع المستويات']
  },
  {
    name: 'Mathematics',
    nameAr: 'الرياضيات',
    educationLevel: 'المتوسط',
    grades: ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط', 'جميع المستويات']
  },
  {
    name: 'Natural Sciences',
    nameAr: 'العلوم الطبيعية',
    educationLevel: 'المتوسط',
    grades: ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط', 'جميع المستويات']
  },
  {
    name: 'Physics',
    nameAr: 'الفيزياء',
    educationLevel: 'المتوسط',
    grades: ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط', 'جميع المستويات']
  },

  // الثانوي (Secondary Level) - EXACTLY 19 subjects
  {
    name: 'Arabic Literature',
    nameAr: 'اللغة العربية وآدابها',
    educationLevel: 'الثانوي',
    grades: ['الأولى ثانوي', 'الثانية ثانوي', 'آداب وفلسفة', 'أدبي', 'علمي', 'تقني رياضي', 'تسيير واقتصاد', 'لغات أجنبية', 'جميع المستويات']
  },
  {
    name: 'English',
    nameAr: 'اللغة الإنجليزية',
    educationLevel: 'الثانوي',
    grades: ['الأولى ثانوي', 'الثانية ثانوي', 'آداب وفلسفة', 'أدبي', 'علمي', 'تقني رياضي', 'تسيير واقتصاد', 'لغات أجنبية', 'جميع المستويات']
  },
  {
    name: 'French',
    nameAr: 'اللغة الفرنسية',
    educationLevel: 'الثانوي',
    grades: ['الأولى ثانوي', 'الثانية ثانوي', 'آداب وفلسفة', 'أدبي', 'علمي', 'تقني رياضي', 'تسيير واقتصاد', 'لغات أجنبية', 'جميع المستويات']
  },
  {
    name: 'German',
    nameAr: 'اللغة الألمانية',
    educationLevel: 'الثانوي',
    grades: ['لغات أجنبية', 'جميع المستويات']
  },
  {
    name: 'Spanish',
    nameAr: 'اللغة الإسبانية',
    educationLevel: 'الثانوي',
    grades: ['لغات أجنبية', 'جميع المستويات']
  },
  {
    name: 'Amazigh',
    nameAr: 'اللغة الأمازيغية',
    educationLevel: 'الثانوي',
    grades: ['جميع المستويات']
  },
  {
    name: 'Mathematics',
    nameAr: 'الرياضيات',
    educationLevel: 'الثانوي',
    grades: ['الأولى ثانوي', 'الثانية ثانوي', 'علمي', 'تقني رياضي', 'تسيير واقتصاد', 'جميع المستويات']
  },
  {
    name: 'Natural Sciences',
    nameAr: 'العلوم الطبيعية والحياة',
    educationLevel: 'الثانوي',
    grades: ['الأولى ثانوي', 'الثانية ثانوي', 'علمي', 'جميع المستويات']
  },
  {
    name: 'Physics',
    nameAr: 'العلوم الفيزيائية',
    educationLevel: 'الثانوي',
    grades: ['الأولى ثانوي', 'الثانية ثانوي', 'علمي', 'تقني رياضي', 'جميع المستويات']
  },
  {
    name: 'History Geography',
    nameAr: 'التاريخ والجغرافيا',
    educationLevel: 'الثانوي',
    grades: ['الأولى ثانوي', 'الثانية ثانوي', 'آداب وفلسفة', 'أدبي', 'تسيير واقتصاد', 'جميع المستويات']
  },
  {
    name: 'Philosophy',
    nameAr: 'الفلسفة',
    educationLevel: 'الثانوي',
    grades: ['الثانية ثانوي', 'آداب وفلسفة', 'أدبي', 'علمي', 'تقني رياضي', 'تسيير واقتصاد', 'جميع المستويات']
  },
  {
    name: 'Islamic Studies',
    nameAr: 'التربية الإسلامية',
    educationLevel: 'الثانوي',
    grades: ['الأولى ثانوي', 'الثانية ثانوي', 'آداب وفلسفة', 'أدبي', 'علمي', 'تقني رياضي', 'تسيير واقتصاد', 'جميع المستويات']
  },
  {
    name: 'Computer Science',
    nameAr: 'الإعلام الآلي',
    educationLevel: 'الثانوي',
    grades: ['الأولى ثانوي', 'الثانية ثانوي', 'تقني رياضي', 'جميع المستويات']
  },
  {
    name: 'Economics',
    nameAr: 'الاقتصاد والمناجمنت',
    educationLevel: 'الثانوي',
    grades: ['الثانية ثانوي', 'تسيير واقتصاد', 'جميع المستويات']
  },
  {
    name: 'Law',
    nameAr: 'القانون',
    educationLevel: 'الثانوي',
    grades: ['تسيير واقتصاد', 'جميع المستويات']
  },
  {
    name: 'Accounting',
    nameAr: 'المحاسبة',
    educationLevel: 'الثانوي',
    grades: ['تسيير واقتصاد', 'جميع المستويات']
  },
  {
    name: 'Electrical Engineering',
    nameAr: 'الهندسة الكهربائية',
    educationLevel: 'الثانوي',
    grades: ['تقني رياضي', 'جميع المستويات']
  },
  {
    name: 'Civil Engineering',
    nameAr: 'الهندسة المدنية',
    educationLevel: 'الثانوي',
    grades: ['تقني رياضي', 'جميع المستويات']
  },
  {
    name: 'Mechanical Engineering',
    nameAr: 'الهندسة الميكانيكية',
    educationLevel: 'الثانوي',
    grades: ['تقني رياضي', 'جميع المستويات']
  }
];

export async function seedExactCurriculum() {
  console.log('🌱 Starting exact curriculum seeding with ONLY the provided subjects...');
  
  let totalCreated = 0;
  
  for (const subject of exactCurriculum) {
    for (const grade of subject.grades) {
      try {
        await db.insert(teachingModules).values({
          name: subject.name,
          nameAr: subject.nameAr,
          educationLevel: subject.educationLevel,
          grade: grade,
          description: `${subject.nameAr} - ${subject.educationLevel} - ${grade}`,
          schoolId: null // Global subject
        });
        
        totalCreated++;
        console.log(`✅ Created: ${subject.nameAr} - ${subject.educationLevel} - ${grade}`);
      } catch (error) {
        console.log(`⚠️ Error creating: ${subject.nameAr} - ${subject.educationLevel} - ${grade}:`, error);
      }
    }
  }
  
  console.log(`✅ Exact curriculum seeding completed! Created ${totalCreated} subject entries.`);
  console.log('📊 Summary:');
  console.log('  - Primary (الابتدائي): 3 subjects');
  console.log('  - Middle (المتوسط): 7 subjects');
  console.log('  - Secondary (الثانوي): 19 subjects');
  console.log('  - Total unique subjects: 29');
}

// Run the seeder if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedExactCurriculum()
    .then(() => {
      console.log('🎉 Exact curriculum standardization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error seeding exact curriculum:', error);
      process.exit(1);
    });
}