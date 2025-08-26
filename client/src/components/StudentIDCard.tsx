import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, QrCode, School, Star, Shield, Award, GraduationCap, User } from 'lucide-react';
import QRCode from 'qrcode';

interface StudentIDCardProps {
  student: {
    id: number;
    name: string;
    educationLevel: string;
    grade: string;
    selectedSubjects?: string[];
    type: 'student' | 'child';
    profilePicture?: string;
  };
  schoolInfo: {
    id: number;
    name: string;
  };
  subjects?: Array<{
    id: number;
    nameAr: string;
  }>;
}

// Helper function to format education level
const formatEducationLevel = (educationLevel: string, grade: string) => {
  const extractYearNumber = (gradeStr: string) => {
    if (gradeStr.includes('الأولى')) return '1';
    if (gradeStr.includes('الثانية')) return '2';
    if (gradeStr.includes('الثالثة')) return '3';
    if (gradeStr.includes('الرابعة')) return '4';
    if (gradeStr.includes('الخامسة')) return '5';
    return gradeStr;
  };

  const yearNumber = extractYearNumber(grade);
  
  if (educationLevel === 'الابتدائي') {
    return `ابتدائي ${yearNumber}`;
  } else if (educationLevel === 'المتوسط') {
    return `متوسط ${yearNumber}`;
  } else if (educationLevel === 'الثانوي') {
    return `ثانوي ${yearNumber}`;
  }
  return `${educationLevel} - ${grade}`;
};

export function StudentIDCard({ student, schoolInfo, subjects = [] }: StudentIDCardProps) {
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate QR code data
  const generateQRCodeData = () => {
    return `${student.type}:${student.id}:${schoolInfo.id}:verified`;
  };

  // Get subject names from IDs
  const getSubjectNames = () => {
    if (!student.selectedSubjects || student.selectedSubjects.length === 0) return [];
    
    return student.selectedSubjects.map(id => {
      const subject = subjects.find(s => s.id.toString() === id);
      return subject ? subject.nameAr : `مادة غير معروفة (${id})`;
    });
  };

  // Generate QR code image
  useEffect(() => {
    const generateQRCode = async () => {
      setIsGenerating(true);
      try {
        const qrData = generateQRCodeData();
        const qrImage = await QRCode.toDataURL(qrData, {
          width: 150,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeImage(qrImage);
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateQRCode();
  }, [student.id, student.type, schoolInfo.id]);

  // Download ID card as image - matches the new professional design exactly
  const downloadIDCard = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Larger canvas for professional design
    canvas.width = 800;
    canvas.height = 600;

    // Gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGradient.addColorStop(0, '#ffffff');
    bgGradient.addColorStop(1, '#f9fafb');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Main border (rounded rectangle effect)
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Header gradient
    const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    headerGradient.addColorStop(0, '#2563eb');
    headerGradient.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, canvas.width, 100);

    // School logo circle in header
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(canvas.width - 60, 50, 28, 0, 2 * Math.PI);
    ctx.fill();
    
    // School icon (simplified)
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏫', canvas.width - 60, 58);

    // School name and subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    const schoolName = schoolInfo?.name || 'اسم المدرسة';
    ctx.fillText(schoolName, (canvas.width - 120) / 2, 45);
    
    ctx.font = '16px Arial';
    ctx.fillText('بطاقة هوية الطالب', (canvas.width - 120) / 2, 75);

    // Decorative header line
    const lineGradient = ctx.createLinearGradient(0, 99, canvas.width, 99);
    lineGradient.addColorStop(0, 'transparent');
    lineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    lineGradient.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 99);
    ctx.lineTo(canvas.width, 99);
    ctx.stroke();

    // Main content area
    const contentStartY = 140;
    const rightColumnX = canvas.width - 60;
    const photoX = 120;

    // Student name section
    ctx.textAlign = 'right';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('👤 الاسم الكامل', rightColumnX, contentStartY);
    
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#1f2937';
    ctx.fillText(student.name, rightColumnX, contentStartY + 35);

    // Student type badge
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(rightColumnX - 150, contentStartY + 10, 100, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(student.type === 'student' ? 'طالب' : 'طفل', rightColumnX - 100, contentStartY + 28);

    // Education level section (green background)
    const eduY = contentStartY + 80;
    ctx.fillStyle = '#dcfce7';
    ctx.fillRect(rightColumnX - 250, eduY - 10, 240, 60);
    
    ctx.textAlign = 'right';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#16a34a';
    ctx.fillText('🎓 المستوى التعليمي', rightColumnX, eduY);
    
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#1f2937';
    ctx.fillText(formatEducationLevel(student.educationLevel, student.grade), rightColumnX, eduY + 30);

    // Student ID section (purple background)
    const idY = contentStartY + 80;
    ctx.fillStyle = '#f3e8ff';
    ctx.fillRect(rightColumnX - 500, idY - 10, 240, 60);
    
    ctx.textAlign = 'right';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#9333ea';
    ctx.fillText('🛡️ رقم الطالب', rightColumnX - 260, idY);
    
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#9333ea';
    ctx.fillText(`#${student.id}`, rightColumnX - 260, idY + 30);

    // Subjects section (orange background)
    const subjectNames = getSubjectNames();
    if (subjectNames.length > 0) {
      const subY = contentStartY + 180;
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(rightColumnX - 500, subY - 10, 490, 80);
      
      ctx.textAlign = 'right';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#ea580c';
      ctx.fillText('🏆 المواد المسجلة', rightColumnX, subY);
      
      ctx.font = '14px Arial';
      ctx.fillStyle = '#374151';
      const subjectsText = subjectNames.slice(0, 4).join(' • ');
      ctx.fillText(subjectsText, rightColumnX, subY + 30);
      
      if (subjectNames.length > 4) {
        ctx.fillStyle = '#ea580c';
        ctx.fillText(`و ${subjectNames.length - 4} مواد أخرى`, rightColumnX, subY + 55);
      }
    }

    // Profile photo section
    const photoY = contentStartY + 20;
    
    // Photo frame with shadow effect
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(photoX - 68, photoY - 4, 136, 136);
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 4;
    ctx.strokeRect(photoX - 64, photoY, 128, 128);

    // Draw profile image or placeholder
    if (student.profilePicture) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        // Clip to photo area
        ctx.beginPath();
        ctx.rect(photoX - 64, photoY, 128, 128);
        ctx.clip();
        ctx.drawImage(img, photoX - 64, photoY, 128, 128);
        ctx.restore();
        
        // Continue with QR code and download
        finishDrawing();
      };
      img.src = student.profilePicture;
    } else {
      // Photo placeholder
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(photoX - 64, photoY, 128, 128);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('👤', photoX, photoY + 80);
      finishDrawing();
    }

    function finishDrawing() {
      if (!ctx) return;
      
      // Photo decoration star
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(photoX + 54, photoY - 10, 12, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⭐', photoX + 54, photoY - 4);

      // QR code section (bigger)
      const qrX = photoX - 48;
      const qrY = photoY + 160;
      
      // QR background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX - 8, qrY - 8, 112, 112);
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 8, qrY - 8, 112, 112);

      // QR label
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('رمز التحقق', qrX + 48, qrY + 125);

      // Add QR code or placeholder
      if (qrCodeImage) {
        const qrImg = new Image();
        qrImg.onload = () => {
          if (!ctx) return;
          ctx.drawImage(qrImg, qrX, qrY, 96, 96);
          downloadImage();
        };
        qrImg.src = qrCodeImage;
      } else {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR', qrX + 48, qrY + 54);
        downloadImage();
      }
    }

    function downloadImage() {
      const link = document.createElement('a');
      link.download = `student_id_${student.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png', 0.9);
      link.click();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Professional ID card */}
      <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-2xl overflow-hidden">
        
        {/* Decorative corner patterns */}
        <div className="absolute top-0 left-0 w-20 h-20 opacity-10">
          <div className="absolute top-2 left-2">
            <Star className="w-4 h-4 text-blue-600 transform rotate-12" />
          </div>
          <div className="absolute top-6 left-8">
            <Shield className="w-3 h-3 text-blue-600 transform -rotate-12" />
          </div>
        </div>
        
        <div className="absolute bottom-0 right-0 w-20 h-20 opacity-10">
          <div className="absolute bottom-2 right-2">
            <Award className="w-4 h-4 text-blue-600 transform rotate-45" />
          </div>
          <div className="absolute bottom-6 right-8">
            <GraduationCap className="w-3 h-3 text-blue-600 transform -rotate-45" />
          </div>
        </div>

        {/* School Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-6 relative">
          <div className="absolute top-4 right-4">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <School className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <div className="text-center pr-20">
            <h2 className="text-3xl font-bold mb-2 tracking-wide">{schoolInfo.name || 'اسم المدرسة'}</h2>
            <p className="text-lg opacity-90 font-medium">بطاقة هوية الطالب</p>
          </div>
          
          {/* Decorative line */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white via-50% to-transparent opacity-30"></div>
        </div>

        {/* Main Content */}
        <div className="flex p-8 gap-8" dir="rtl">
          {/* Student Information */}
          <div className="flex-1 space-y-6">
            {/* Name and Type */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الاسم الكامل</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-wide">{student.name}</p>
                </div>
                <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-bold shadow-lg">
                  {student.type === 'student' ? 'طالب' : 'طفل'}
                </div>
              </div>
            </div>

            {/* Academic Info */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">المستوى التعليمي</p>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded-lg">
                  {formatEducationLevel(student.educationLevel, student.grade)}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">رقم الطالب</p>
                </div>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-3 py-2 rounded-lg">
                  #{student.id}
                </p>
              </div>
            </div>

            {/* Subjects */}
            {getSubjectNames().length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-600" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">المواد المسجلة</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                    {getSubjectNames().slice(0, 4).join(' • ')}
                    {getSubjectNames().length > 4 && (
                      <span className="text-orange-600 dark:text-orange-400 font-bold"> و {getSubjectNames().length - 4} مواد أخرى</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Photo and QR Section */}
          <div className="w-48 flex flex-col items-center space-y-6">
            {/* Profile Photo */}
            <div className="relative">
              <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-white dark:border-gray-600 shadow-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700">
                {student.profilePicture ? (
                  <img 
                    src={student.profilePicture} 
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>
              {/* Photo decoration */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 text-white" />
              </div>
            </div>
            
            {/* QR Code - Bigger */}
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-lg">
                {isGenerating ? (
                  <div className="w-24 h-24 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-gray-400 animate-pulse" />
                  </div>
                ) : qrCodeImage ? (
                  <img src={qrCodeImage} alt="QR Code" className="w-24 h-24" />
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2 font-medium">رمز التحقق</p>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
          <Button
            onClick={downloadIDCard}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <Download className="w-5 h-5 mr-3" />
            تحميل بطاقة الهوية
          </Button>
        </div>
      </div>
    </div>
  );
}