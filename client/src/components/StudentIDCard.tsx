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

  // Download ID card as image - clean and simple
  const downloadIDCard = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Compact canvas size
    canvas.width = 600;
    canvas.height = 350;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Blue header
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, 0, canvas.width, 60);

    // School logo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(canvas.width - 35, 30, 15, 0, 2 * Math.PI);
    ctx.fill();

    // School name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    const schoolName = schoolInfo?.name || 'اسم المدرسة';
    ctx.fillText(schoolName, (canvas.width - 70) / 2, 28);
    
    ctx.font = '12px Arial';
    ctx.fillText('بطاقة هوية الطالب', (canvas.width - 70) / 2, 48);

    // Content area
    const rightX = canvas.width - 30;
    const leftX = 120;

    // Student name
    ctx.textAlign = 'right';
    ctx.font = '10px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('الاسم', rightX, 90);
    
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#1f2937';
    ctx.fillText(student.name, rightX, 110);

    // Student type
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(rightX - 80, 95, 60, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(student.type === 'student' ? 'طالب' : 'طفل', rightX - 50, 107);

    // Education level
    ctx.textAlign = 'right';
    ctx.font = '10px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('المستوى', rightX, 140);
    
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#1f2937';
    ctx.fillText(formatEducationLevel(student.educationLevel, student.grade), rightX, 158);

    // Student ID
    ctx.font = '10px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('الرقم', rightX - 150, 140);
    
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#2563eb';
    ctx.fillText(`#${student.id}`, rightX - 150, 158);

    // Subjects
    const subjectNames = getSubjectNames();
    if (subjectNames.length > 0) {
      ctx.textAlign = 'right';
      ctx.font = '10px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('المواد', rightX, 185);
      
      ctx.font = '10px Arial';
      ctx.fillStyle = '#374151';
      const subjectsText = subjectNames.slice(0, 3).join(' • ');
      ctx.fillText(subjectsText, rightX, 202);
      
      if (subjectNames.length > 3) {
        ctx.fillStyle = '#2563eb';
        ctx.fillText(`و ${subjectNames.length - 3} أخرى`, rightX, 218);
      }
    }

    // Photo frame
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 80, 80, 80);
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(30, 80, 80, 80);

    // Draw profile image or placeholder
    if (student.profilePicture) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(30, 80, 80, 80);
        ctx.clip();
        ctx.drawImage(img, 30, 80, 80, 80);
        ctx.restore();
        finishWithQR();
      };
      img.src = student.profilePicture;
    } else {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('👤', 70, 130);
      finishWithQR();
    }

    function finishWithQR() {
      if (!ctx) return;
      
      // QR code background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(25, 180, 90, 90);
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.strokeRect(25, 180, 90, 90);

      if (qrCodeImage) {
        const qrImg = new Image();
        qrImg.onload = () => {
          if (!ctx) return;
          ctx.drawImage(qrImg, 30, 185, 80, 80);
          downloadImage();
        };
        qrImg.src = qrCodeImage;
      } else {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR', 70, 230);
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
    <div className="w-full max-w-2xl mx-auto">
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

        {/* School Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-4 relative">
          <div className="absolute top-3 right-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <School className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <div className="text-center pr-16">
            <h2 className="text-xl font-bold mb-1">{schoolInfo.name || 'اسم المدرسة'}</h2>
            <p className="text-sm opacity-90">بطاقة هوية الطالب</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex p-4 gap-4" dir="rtl">
          {/* Student Information */}
          <div className="flex-1 space-y-3">
            {/* Name and Type */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">الاسم</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{student.name}</p>
              </div>
              <div className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-bold">
                {student.type === 'student' ? 'طالب' : 'طفل'}
              </div>
            </div>

            {/* Academic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">المستوى</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatEducationLevel(student.educationLevel, student.grade)}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">الرقم</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">#{student.id}</p>
              </div>
            </div>

            {/* Subjects */}
            {getSubjectNames().length > 0 && (
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">المواد</p>
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  {getSubjectNames().slice(0, 3).join(' • ')}
                  {getSubjectNames().length > 3 && (
                    <span className="text-blue-600 dark:text-blue-400"> و {getSubjectNames().length - 3} أخرى</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Photo and QR Section */}
          <div className="w-32 flex flex-col items-center space-y-3">
            {/* Profile Photo */}
            <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-600">
              {student.profilePicture ? (
                <img 
                  src={student.profilePicture} 
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>
            
            {/* QR Code */}
            <div className="bg-white dark:bg-gray-800 p-2 rounded border">
              {isGenerating ? (
                <div className="w-20 h-20 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-gray-400 animate-pulse" />
                </div>
              ) : qrCodeImage ? (
                <img src={qrCodeImage} alt="QR Code" className="w-20 h-20" />
              ) : (
                <div className="w-20 h-20 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-600">
          <Button
            onClick={downloadIDCard}
            variant="outline"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            تحميل بطاقة الهوية
          </Button>
        </div>
      </div>
    </div>
  );
}