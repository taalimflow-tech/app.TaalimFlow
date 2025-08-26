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

  const downloadIDCard = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 350;

    // Try to load Arabic font, fallback to Arial if fails
    let fontFamily = 'Arial';
    try {
      const font = new FontFace(
        'NotoArabic',
        'url(https://fonts.gstatic.com/s/notosansarabic/v17/3q2b8AJk6y2izaplaR2gLA.woff2)'
      );
      await font.load();
      document.fonts.add(font);
      fontFamily = 'NotoArabic';
    } catch (error) {
      console.log('Font loading failed, using fallback');
    }

    // Helper function for rounded rectangles (browser compatibility)
    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    // White background with rounded corners
    ctx.fillStyle = '#ffffff';
    roundRect(0, 0, canvas.width, canvas.height, 20);
    ctx.fill();

    // Gradient header
    const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    headerGradient.addColorStop(0, '#2563eb');
    headerGradient.addColorStop(1, '#3b82f6');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, canvas.width, 60);

    // School name
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = `bold 20px ${fontFamily}`;
    ctx.fillText(schoolInfo?.name || 'اسم المدرسة', canvas.width / 2, 35);
    ctx.font = `14px ${fontFamily}`;
    ctx.fillText('بطاقة هوية الطالب', canvas.width / 2, 50);

    // Profile photo
    const photoX = 30;
    const photoY = 90;
    const photoSize = 80;
    ctx.fillStyle = '#f3f4f6';
    ctx.beginPath();
    ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, 2 * Math.PI);
    ctx.fill();

    const drawCardDetails = () => {
      const rightX = canvas.width - 30;

      // Student name
      ctx.textAlign = 'right';
      ctx.fillStyle = '#1f2937';
      ctx.font = `bold 18px ${fontFamily}`;
      ctx.fillText(student.name, rightX, 110);

      // Student type badge
      const typeText = student.type === 'student' ? 'طالب' : 'طفل';
      const badgeWidth = 60;
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(rightX - badgeWidth, 95, badgeWidth, 24);
      ctx.fillStyle = '#fff';
      ctx.font = `bold 12px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.fillText(typeText, rightX - badgeWidth / 2, 109);

      // Education level
      ctx.textAlign = 'right';
      ctx.fillStyle = '#6b7280';
      ctx.font = `12px ${fontFamily}`;
      ctx.fillText('المستوى', rightX, 140);
      ctx.fillStyle = '#1f2937';
      ctx.font = `bold 14px ${fontFamily}`;
      ctx.fillText(formatEducationLevel(student.educationLevel, student.grade), rightX, 160);

      // Student ID
      ctx.fillStyle = '#6b7280';
      ctx.font = `12px ${fontFamily}`;
      ctx.fillText('الرقم', rightX - 150, 140);
      ctx.fillStyle = '#2563eb';
      ctx.font = `bold 14px ${fontFamily}`;
      ctx.fillText(`#${student.id}`, rightX - 150, 160);

      // Subjects
      const subjectNames = getSubjectNames();
      if (subjectNames.length > 0) {
        ctx.fillStyle = '#6b7280';
        ctx.font = `12px ${fontFamily}`;
        ctx.fillText('المواد', rightX, 185);
        ctx.fillStyle = '#374151';
        ctx.font = `12px ${fontFamily}`;
        ctx.fillText(subjectNames.slice(0, 3).join(' • '), rightX, 205);
        if (subjectNames.length > 3) {
          ctx.fillStyle = '#2563eb';
          ctx.fillText(`و ${subjectNames.length - 3} أخرى`, rightX, 225);
        }
      }

      // QR code
      const qrX = 30;
      const qrY = 190;
      const qrSize = 90;
      ctx.fillStyle = '#fff';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      ctx.strokeStyle = '#d1d5db';
      ctx.strokeRect(qrX, qrY, qrSize, qrSize);

      if (qrCodeImage) {
        const qrImg = new Image();
        qrImg.onload = () => {
          ctx.drawImage(qrImg, qrX + 5, qrY + 5, qrSize - 10, qrSize - 10);
          downloadCanvas();
        };
        qrImg.src = qrCodeImage;
      } else {
        ctx.fillStyle = '#9ca3af';
        ctx.font = `14px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('QR', qrX + qrSize / 2, qrY + qrSize / 1.7);
        downloadCanvas();
      }
    };

    if (student.profilePicture) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(img, photoX, photoY, photoSize, photoSize);
        ctx.restore();
        drawCardDetails();
      };
      img.src = student.profilePicture;
    } else {
      ctx.fillStyle = '#9ca3af';
      ctx.font = `36px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.fillText('👤', photoX + photoSize / 2, photoY + photoSize / 1.5);
      drawCardDetails();
    }

    function downloadCanvas() {
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