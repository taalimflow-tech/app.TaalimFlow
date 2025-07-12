// Seed teaching modules for the Algerian education system
const modules = [
  // الابتدائي (Primary) - Common subjects for all grades
  { name: "Arabic Language", nameAr: "اللغة العربية", educationLevel: "الابتدائي", grade: "مشترك", description: "تعلم القراءة والكتابة باللغة العربية" },
  { name: "Mathematics", nameAr: "الرياضيات", educationLevel: "الابتدائي", grade: "مشترك", description: "أساسيات الرياضيات للمرحلة الابتدائية" },
  { name: "French Language", nameAr: "اللغة الفرنسية", educationLevel: "الابتدائي", grade: "مشترك", description: "أساسيات اللغة الفرنسية" },
  { name: "English Language", nameAr: "اللغة الإنجليزية", educationLevel: "الابتدائي", grade: "مشترك", description: "أساسيات اللغة الإنجليزية" },
  
  // المتوسط (Middle School) - Common subjects for all 4 grades
  { name: "Arabic Language", nameAr: "اللغة العربية", educationLevel: "المتوسط", grade: "مشترك", description: "الأدب والنحو والصرف للمرحلة المتوسطة" },
  { name: "Mathematics", nameAr: "الرياضيات", educationLevel: "المتوسط", grade: "مشترك", description: "الجبر والهندسة للمرحلة المتوسطة" },
  { name: "Physics", nameAr: "الفيزياء", educationLevel: "المتوسط", grade: "مشترك", description: "الفيزياء العامة والتطبيقية" },
  { name: "Natural Sciences", nameAr: "العلوم الطبيعية", educationLevel: "المتوسط", grade: "مشترك", description: "علوم الطبيعة والحياة" },
  { name: "French Language", nameAr: "اللغة الفرنسية", educationLevel: "المتوسط", grade: "مشترك", description: "قواعد اللغة الفرنسية والتعبير" },
  { name: "English Language", nameAr: "اللغة الإنجليزية", educationLevel: "المتوسط", grade: "مشترك", description: "اللغة الإنجليزية للمرحلة المتوسطة" },
  { name: "History & Geography", nameAr: "التاريخ والجغرافيا", educationLevel: "المتوسط", grade: "مشترك", description: "التاريخ الإسلامي والحديث والجغرافيا" },
  
  // الثانوي - السنة الأولى - الجذع المشترك العلمي
  { name: "Arabic Language", nameAr: "اللغة العربية", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك علمي", description: "الأدب العربي والنحو والصرف" },
  { name: "French Language", nameAr: "اللغة الفرنسية", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك علمي", description: "الأدب الفرنسي والتعبير الكتابي" },
  { name: "English Language", nameAr: "اللغة الإنجليزية", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك علمي", description: "اللغة الإنجليزية المتقدمة" },
  { name: "Mathematics", nameAr: "الرياضيات", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك علمي", description: "الرياضيات المتقدمة والتحليل" },
  { name: "Natural Sciences", nameAr: "العلوم الطبيعية", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك علمي", description: "علوم الطبيعة والحياة المتقدمة" },
  { name: "Physics", nameAr: "الفيزياء", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك علمي", description: "الفيزياء العامة والميكانيكا" },
  { name: "Computer Science", nameAr: "الإعلام الآلي", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك علمي", description: "البرمجة وعلوم الحاسوب" },
  { name: "Islamic Studies", nameAr: "التربية الإسلامية", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك علمي", description: "الفقه والسيرة والأخلاق" },
  { name: "Philosophy", nameAr: "الفلسفة", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك علمي", description: "مبادئ الفلسفة والمنطق" },
  { name: "History & Geography", nameAr: "التاريخ والجغرافيا", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك علمي", description: "التاريخ المعاصر والجغرافيا" },
  
  // الثانوي - السنة الأولى - الجذع المشترك آداب
  { name: "Arabic Language", nameAr: "اللغة العربية", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك آداب", description: "الأدب العربي والنحو والصرف" },
  { name: "French Language", nameAr: "اللغة الفرنسية", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك آداب", description: "الأدب الفرنسي والتعبير الكتابي" },
  { name: "English Language", nameAr: "اللغة الإنجليزية", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك آداب", description: "اللغة الإنجليزية المتقدمة" },
  { name: "Mathematics", nameAr: "الرياضيات", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك آداب", description: "الرياضيات للشعب الأدبية" },
  { name: "Philosophy", nameAr: "الفلسفة", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك آداب", description: "الفلسفة والمنطق والأخلاق" },
  { name: "History & Geography", nameAr: "التاريخ والجغرافيا", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك آداب", description: "التاريخ المعاصر والجغرافيا البشرية" },
  { name: "Islamic Studies", nameAr: "التربية الإسلامية", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك آداب", description: "الفقه والسيرة والأخلاق" },
  { name: "Civic Education", nameAr: "التربية المدنية", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك آداب", description: "التربية المدنية والحقوق" },
  { name: "Computer Science", nameAr: "الإعلام الآلي", educationLevel: "الثانوي", grade: "الأولى - جذع مشترك آداب", description: "أساسيات الحاسوب والإنترنت" },
  
  // الثانوي - السنة الثانية والثالثة - شعبة العلوم التجريبية
  { name: "Arabic Language", nameAr: "اللغة العربية", educationLevel: "الثانوي", grade: "الثانية والثالثة - العلوم التجريبية", description: "الأدب العربي المتقدم" },
  { name: "French Language", nameAr: "اللغة الفرنسية", educationLevel: "الثانوي", grade: "الثانية والثالثة - العلوم التجريبية", description: "الأدب الفرنسي والتعبير العلمي" },
  { name: "English Language", nameAr: "اللغة الإنجليزية", educationLevel: "الثانوي", grade: "الثانية والثالثة - العلوم التجريبية", description: "اللغة الإنجليزية التخصصية" },
  { name: "Mathematics", nameAr: "الرياضيات", educationLevel: "الثانوي", grade: "الثانية والثالثة - العلوم التجريبية", description: "الرياضيات المتقدمة والتحليل الرياضي" },
  { name: "Physics", nameAr: "الفيزياء", educationLevel: "الثانوي", grade: "الثانية والثالثة - العلوم التجريبية", description: "الفيزياء المتقدمة والكهرومغناطيسية" },
  { name: "Natural Sciences", nameAr: "العلوم الطبيعية", educationLevel: "الثانوي", grade: "الثانية والثالثة - العلوم التجريبية", description: "علم الأحياء والوراثة والكيمياء الحيوية" },
  { name: "Philosophy", nameAr: "الفلسفة", educationLevel: "الثانوي", grade: "الثانية والثالثة - العلوم التجريبية", description: "الفلسفة والمنطق العلمي" },
  { name: "History & Geography", nameAr: "التاريخ والجغرافيا", educationLevel: "الثانوي", grade: "الثانية والثالثة - العلوم التجريبية", description: "التاريخ المعاصر والجغرافيا الاقتصادية" },
  { name: "Islamic Studies", nameAr: "التربية الإسلامية", educationLevel: "الثانوي", grade: "الثانية والثالثة - العلوم التجريبية", description: "الفقه والسيرة والأخلاق الإسلامية" },
  
  // الثانوي - السنة الثانية والثالثة - شعبة الرياضيات
  { name: "Arabic Language", nameAr: "اللغة العربية", educationLevel: "الثانوي", grade: "الثانية والثالثة - الرياضيات", description: "الأدب العربي المتقدم" },
  { name: "French Language", nameAr: "اللغة الفرنسية", educationLevel: "الثانوي", grade: "الثانية والثالثة - الرياضيات", description: "الأدب الفرنسي والتعبير الرياضي" },
  { name: "English Language", nameAr: "اللغة الإنجليزية", educationLevel: "الثانوي", grade: "الثانية والثالثة - الرياضيات", description: "اللغة الإنجليزية التخصصية" },
  { name: "Mathematics", nameAr: "الرياضيات", educationLevel: "الثانوي", grade: "الثانية والثالثة - الرياضيات", description: "الرياضيات العليا والتحليل المتقدم" },
  { name: "Physics", nameAr: "الفيزياء", educationLevel: "الثانوي", grade: "الثانية والثالثة - الرياضيات", description: "الفيزياء الرياضية والميكانيكا" },
  { name: "Natural Sciences", nameAr: "العلوم الطبيعية", educationLevel: "الثانوي", grade: "الثانية والثالثة - الرياضيات", description: "العلوم الطبيعية التطبيقية" },
  { name: "Philosophy", nameAr: "الفلسفة", educationLevel: "الثانوي", grade: "الثانية والثالثة - الرياضيات", description: "الفلسفة والمنطق الرياضي" },
  { name: "History & Geography", nameAr: "التاريخ والجغرافيا", educationLevel: "الثانوي", grade: "الثانية والثالثة - الرياضيات", description: "التاريخ والجغرافيا الكمية" },
  { name: "Islamic Studies", nameAr: "التربية الإسلامية", educationLevel: "الثانوي", grade: "الثانية والثالثة - الرياضيات", description: "الفقه والسيرة والأخلاق الإسلامية" },
  
  // الثانوي - السنة الثانية والثالثة - شعبة تقني رياضي
  { name: "Mathematics", nameAr: "الرياضيات", educationLevel: "الثانوي", grade: "الثانية والثالثة - تقني رياضي", description: "الرياضيات التطبيقية والهندسية" },
  { name: "Physics", nameAr: "الفيزياء", educationLevel: "الثانوي", grade: "الثانية والثالثة - تقني رياضي", description: "الفيزياء التطبيقية والصناعية" },
  { name: "Mechanics", nameAr: "الميكانيك", educationLevel: "الثانوي", grade: "الثانية والثالثة - تقني رياضي", description: "الميكانيك الصناعي والآلات" },
  { name: "Electrical Engineering", nameAr: "الكهرباء", educationLevel: "الثانوي", grade: "الثانية والثالثة - تقني رياضي", description: "الكهرباء والإلكترونيات الصناعية" },
  { name: "Arabic Language", nameAr: "اللغة العربية", educationLevel: "الثانوي", grade: "الثانية والثالثة - تقني رياضي", description: "الأدب العربي والتعبير التقني" },
  { name: "French Language", nameAr: "اللغة الفرنسية", educationLevel: "الثانوي", grade: "الثانية والثالثة - تقني رياضي", description: "الفرنسية التقنية والمهنية" },
  { name: "English Language", nameAr: "اللغة الإنجليزية", educationLevel: "الثانوي", grade: "الثانية والثالثة - تقني رياضي", description: "الإنجليزية التقنية والمهنية" },
  { name: "Islamic Studies", nameAr: "التربية الإسلامية", educationLevel: "الثانوي", grade: "الثانية والثالثة - تقني رياضي", description: "الفقه والسيرة والأخلاق الإسلامية" },
  { name: "Philosophy", nameAr: "الفلسفة", educationLevel: "الثانوي", grade: "الثانية والثالثة - تقني رياضي", description: "الفلسفة والأخلاق المهنية" },
  { name: "History & Geography", nameAr: "التاريخ والجغرافيا", educationLevel: "الثانوي", grade: "الثانية والثالثة - تقني رياضي", description: "التاريخ الصناعي والجغرافيا الاقتصادية" },
  
  // الثانوي - السنة الثانية والثالثة - شعبة آداب وفلسفة
  { name: "Arabic Language", nameAr: "اللغة العربية", educationLevel: "الثانوي", grade: "الثانية والثالثة - آداب وفلسفة", description: "الأدب العربي والنقد الأدبي" },
  { name: "French Language", nameAr: "اللغة الفرنسية", educationLevel: "الثانوي", grade: "الثانية والثالثة - آداب وفلسفة", description: "الأدب الفرنسي والنقد الأدبي" },
  { name: "English Language", nameAr: "اللغة الإنجليزية", educationLevel: "الثانوي", grade: "الثانية والثالثة - آداب وفلسفة", description: "الأدب الإنجليزي والنقد الأدبي" },
  { name: "Philosophy", nameAr: "الفلسفة", educationLevel: "الثانوي", grade: "الثانية والثالثة - آداب وفلسفة", description: "الفلسفة المعمقة والأخلاق والمنطق" },
  { name: "Mathematics", nameAr: "الرياضيات", educationLevel: "الثانوي", grade: "الثانية والثالثة - آداب وفلسفة", description: "الرياضيات الأساسية للشعب الأدبية" },
  { name: "History & Geography", nameAr: "التاريخ والجغرافيا", educationLevel: "الثانوي", grade: "الثانية والثالثة - آداب وفلسفة", description: "التاريخ الحضاري والجغرافيا الثقافية" },
  { name: "Islamic Studies", nameAr: "التربية الإسلامية", educationLevel: "الثانوي", grade: "الثانية والثالثة - آداب وفلسفة", description: "الفقه والسيرة والأخلاق الإسلامية" },
  
  // الثانوي - السنة الثانية والثالثة - شعبة لغات أجنبية
  { name: "Arabic Language", nameAr: "اللغة العربية", educationLevel: "الثانوي", grade: "الثانية والثالثة - لغات أجنبية", description: "الأدب العربي والترجمة" },
  { name: "French Language", nameAr: "اللغة الفرنسية", educationLevel: "الثانوي", grade: "الثانية والثالثة - لغات أجنبية", description: "الأدب الفرنسي والترجمة المتقدمة" },
  { name: "English Language", nameAr: "اللغة الإنجليزية", educationLevel: "الثانوي", grade: "الثانية والثالثة - لغات أجنبية", description: "الأدب الإنجليزي والترجمة المتقدمة" },
  { name: "German Language", nameAr: "اللغة الألمانية", educationLevel: "الثانوي", grade: "الثانية والثالثة - لغات أجنبية", description: "اللغة الألمانية والأدب الألماني" },
  { name: "Spanish Language", nameAr: "اللغة الإسبانية", educationLevel: "الثانوي", grade: "الثانية والثالثة - لغات أجنبية", description: "اللغة الإسبانية والأدب الإسباني" },
  { name: "Philosophy", nameAr: "الفلسفة", educationLevel: "الثانوي", grade: "الثانية والثالثة - لغات أجنبية", description: "الفلسفة واللسانيات" },
  { name: "History & Geography", nameAr: "التاريخ والجغرافيا", educationLevel: "الثانوي", grade: "الثانية والثالثة - لغات أجنبية", description: "التاريخ العالمي والجغرافيا الثقافية" },
  { name: "Islamic Studies", nameAr: "التربية الإسلامية", educationLevel: "الثانوي", grade: "الثانية والثالثة - لغات أجنبية", description: "الفقه والسيرة والأخلاق الإسلامية" },
  
  // الثانوي - السنة الثانية والثالثة - شعبة تسيير واقتصاد
  { name: "Economics", nameAr: "الاقتصاد", educationLevel: "الثانوي", grade: "الثانية والثالثة - تسيير واقتصاد", description: "الاقتصاد الجزئي والكلي" },
  { name: "Law", nameAr: "القانون", educationLevel: "الثانوي", grade: "الثانية والثالثة - تسيير واقتصاد", description: "القانون التجاري والمدني" },
  { name: "Mathematics", nameAr: "الرياضيات", educationLevel: "الثانوي", grade: "الثانية والثالثة - تسيير واقتصاد", description: "الرياضيات المالية والإحصاء" },
  { name: "Accounting", nameAr: "المحاسبة", educationLevel: "الثانوي", grade: "الثانية والثالثة - تسيير واقتصاد", description: "المحاسبة العامة والتحليلية" },
  { name: "Computer Science", nameAr: "الإعلام الآلي", educationLevel: "الثانوي", grade: "الثانية والثالثة - تسيير واقتصاد", description: "الإعلام الآلي التطبيقي والتسيير" },
  { name: "Arabic Language", nameAr: "اللغة العربية", educationLevel: "الثانوي", grade: "الثانية والثالثة - تسيير واقتصاد", description: "الأدب العربي والتعبير التجاري" },
  { name: "French Language", nameAr: "اللغة الفرنسية", educationLevel: "الثانوي", grade: "الثانية والثالثة - تسيير واقتصاد", description: "الفرنسية التجارية والإدارية" },
  { name: "English Language", nameAr: "اللغة الإنجليزية", educationLevel: "الثانوي", grade: "الثانية والثالثة - تسيير واقتصاد", description: "الإنجليزية التجارية والإدارية" },
  { name: "Islamic Studies", nameAr: "التربية الإسلامية", educationLevel: "الثانوي", grade: "الثانية والثالثة - تسيير واقتصاد", description: "الفقه والسيرة والأخلاق الإسلامية" },
  { name: "Philosophy", nameAr: "الفلسفة", educationLevel: "الثانوي", grade: "الثانية والثالثة - تسيير واقتصاد", description: "الفلسفة والأخلاق التجارية" }
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