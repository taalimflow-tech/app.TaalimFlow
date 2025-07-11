// Seed teaching modules for the system
const modules = [
  // الابتدائي (Primary)
  { name: "Mathematics", nameAr: "الرياضيات", educationLevel: "الابتدائي", grade: "الأولى", description: "أساسيات الرياضيات للسنة الأولى ابتدائي" },
  { name: "Arabic Language", nameAr: "اللغة العربية", educationLevel: "الابتدائي", grade: "الأولى", description: "تعلم القراءة والكتابة باللغة العربية" },
  { name: "French Language", nameAr: "اللغة الفرنسية", educationLevel: "الابتدائي", grade: "الثالثة", description: "أساسيات اللغة الفرنسية" },
  { name: "Science", nameAr: "العلوم", educationLevel: "الابتدائي", grade: "الرابعة", description: "علوم الطبيعة والحياة" },
  { name: "History", nameAr: "التاريخ", educationLevel: "الابتدائي", grade: "الخامسة", description: "التاريخ الوطني والعالمي" },
  { name: "Geography", nameAr: "الجغرافيا", educationLevel: "الابتدائي", grade: "الخامسة", description: "جغرافيا الوطن والعالم" },
  
  // المتوسط (Middle School)
  { name: "Mathematics", nameAr: "الرياضيات", educationLevel: "المتوسط", grade: "الأولى", description: "الجبر والهندسة للسنة الأولى متوسط" },
  { name: "Arabic Language", nameAr: "اللغة العربية", educationLevel: "المتوسط", grade: "الأولى", description: "الأدب والنحو والصرف" },
  { name: "French Language", nameAr: "اللغة الفرنسية", educationLevel: "المتوسط", grade: "الأولى", description: "قواعد اللغة الفرنسية والتعبير" },
  { name: "English Language", nameAr: "اللغة الإنجليزية", educationLevel: "المتوسط", grade: "الأولى", description: "أساسيات اللغة الإنجليزية" },
  { name: "Physics", nameAr: "الفيزياء", educationLevel: "المتوسط", grade: "الثانية", description: "الفيزياء العامة والتطبيقية" },
  { name: "Chemistry", nameAr: "الكيمياء", educationLevel: "المتوسط", grade: "الثانية", description: "الكيمياء العامة والتفاعلات" },
  { name: "Biology", nameAr: "علوم الطبيعة والحياة", educationLevel: "المتوسط", grade: "الثانية", description: "علم الأحياء والنباتات" },
  { name: "History", nameAr: "التاريخ", educationLevel: "المتوسط", grade: "الثالثة", description: "التاريخ الإسلامي والحديث" },
  { name: "Geography", nameAr: "الجغرافيا", educationLevel: "المتوسط", grade: "الثالثة", description: "الجغرافيا الطبيعية والبشرية" },
  { name: "Islamic Studies", nameAr: "التربية الإسلامية", educationLevel: "المتوسط", grade: "الرابعة", description: "الفقه والسيرة والأخلاق" },
  
  // الثانوي (High School)
  { name: "Advanced Mathematics", nameAr: "الرياضيات", educationLevel: "الثانوي", grade: "الأولى", description: "الرياضيات المتقدمة والتحليل" },
  { name: "Arabic Literature", nameAr: "الأدب العربي", educationLevel: "الثانوي", grade: "الأولى", description: "الأدب العربي الكلاسيكي والحديث" },
  { name: "French Literature", nameAr: "الأدب الفرنسي", educationLevel: "الثانوي", grade: "الأولى", description: "الأدب الفرنسي والتحليل النصي" },
  { name: "English Literature", nameAr: "الأدب الإنجليزي", educationLevel: "الثانوي", grade: "الأولى", description: "الأدب الإنجليزي والتحليل" },
  { name: "Advanced Physics", nameAr: "الفيزياء المتقدمة", educationLevel: "الثانوي", grade: "الثانية", description: "الفيزياء النووية والكهرومغناطيسية" },
  { name: "Organic Chemistry", nameAr: "الكيمياء العضوية", educationLevel: "الثانوي", grade: "الثانية", description: "الكيمياء العضوية والتحليل الكيميائي" },
  { name: "Biology & Genetics", nameAr: "علوم الطبيعة والحياة", educationLevel: "الثانوي", grade: "الثانية", description: "علم الوراثة وعلم الأحياء المتقدم" },
  { name: "Philosophy", nameAr: "الفلسفة", educationLevel: "الثانوي", grade: "الثالثة", description: "الفلسفة والمنطق والأخلاق" },
  { name: "Economics", nameAr: "الاقتصاد", educationLevel: "الثانوي", grade: "الثالثة", description: "الاقتصاد والتسيير" },
  { name: "Computer Science", nameAr: "الإعلام الآلي", educationLevel: "الثانوي", grade: "الثالثة", description: "البرمجة وعلوم الحاسوب" }
];

async function seedModules() {
  try {
    const response = await fetch('http://localhost:5000/api/admin/teaching-modules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modules[0])
    });
    
    console.log('Sample module creation response:', await response.json());
    
    console.log('Modules to be created:');
    modules.forEach((module, index) => {
      console.log(`${index + 1}. ${module.nameAr} (${module.educationLevel} - ${module.grade})`);
    });
    
    console.log('\nTo create all modules, run each POST request to /api/admin/teaching-modules with admin authentication');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Export modules for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { modules };
} else {
  console.log('Modules ready for seeding:', modules.length);
}