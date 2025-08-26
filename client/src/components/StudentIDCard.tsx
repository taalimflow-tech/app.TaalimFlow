import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, QrCode, School } from 'lucide-react';
import QRCode from 'qrcode';

interface StudentIDCardProps {
  student: {
    id: number;
    name: string;
    educationLevel: string;
    grade: string;
    selectedSubjects?: string[];
    type: 'student' | 'child';
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

  // Download ID card as image
  const downloadIDCard = () => {
    // Create a canvas to draw the ID card using the provided template
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load the background template image
    const backgroundImg = new Image();
    backgroundImg.onload = () => {
      // Set canvas size to match the template
      canvas.width = backgroundImg.width;
      canvas.height = backgroundImg.height;

      // Draw the background template
      ctx.drawImage(backgroundImg, 0, 0);

      // Now fill in the student data on top of the template
      
      // School name at the top (replace "SCHOOL NAME" area)
      ctx.fillStyle = '#2c3e8c'; // Dark blue color matching template
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      const schoolName = schoolInfo?.name || 'اسم المدرسة';
      ctx.fillText(schoolName, canvas.width / 2, 90);

      // Student name (next to الإسم label)
      ctx.fillStyle = '#2c3e8c';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(student.name, canvas.width - 50, 240);

      // Education level (next to المستوى label)
      ctx.fillStyle = '#2c3e8c';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'right';
      const educationLevel = formatEducationLevel(student.educationLevel, student.grade);
      ctx.fillText(educationLevel, canvas.width - 50, 290);

      // Student ID (next to المعرف المدرسي label)
      ctx.fillStyle = '#2c3e8c';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(student.id.toString(), canvas.width - 50, 340);

      // Student picture placeholder (in the picture frame area)
      const photoX = 85;
      const photoY = 205;
      const photoWidth = 120;
      const photoHeight = 90;
      
      // Fill the photo area with a gradient background
      const gradient = ctx.createLinearGradient(photoX, photoY, photoX, photoY + photoHeight);
      gradient.addColorStop(0, '#87ceeb'); // Light blue
      gradient.addColorStop(1, '#32cd32'); // Green
      ctx.fillStyle = gradient;
      ctx.fillRect(photoX, photoY, photoWidth, photoHeight);
      
      // Add "Student Picture" text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Student', photoX + photoWidth/2, photoY + photoHeight/2 - 5);
      ctx.fillText('Picture', photoX + photoWidth/2, photoY + photoHeight/2 + 15);

      // Add QR code if available (in the QR code frame area)
      const qrX = 85;
      const qrY = 325;
      const qrSize = 100;

      if (qrCodeImage) {
        const qrImg = new Image();
        qrImg.onload = () => {
          // Draw QR code in the correct position
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          
          // Download the canvas as image
          const link = document.createElement('a');
          link.download = `student_id_${student.name.replace(/\s+/g, '_')}.png`;
          link.href = canvas.toDataURL('image/png', 0.9);
          link.click();
        };
        qrImg.src = qrCodeImage;
      } else {
        // QR placeholder
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(qrX, qrY, qrSize, qrSize);
        ctx.fillStyle = '#666666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', qrX + qrSize/2, qrY + qrSize/2);
        
        // Download without QR code
        const link = document.createElement('a');
        link.download = `student_id_${student.name.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png', 0.9);
        link.click();
      }
    };

    // Set the source to the attached template image
    backgroundImg.src = '/attached_assets/White Grey Simple Minimalist Student ID Card_1756170828385.png';
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Simple ID card with real dimensions */}
      <div className="relative bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg" style={{ aspectRatio: '1.6/1' }}>
        
        {/* School Logo in top corner */}
        <div className="absolute top-3 right-3 z-10">
          <div className="w-12 h-12 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center">
            <School className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* School Header */}
        <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 rounded-t-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">{schoolInfo.name || 'اسم المدرسة'}</h2>
            <p className="text-base">بطاقة هوية الطالب</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex p-6" dir="rtl">
          {/* Student Info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">الاسم</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{student.name}</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm font-semibold">
                {student.type === 'student' ? 'طالب' : 'طفل'}
              </span>
            </div>

            <div className="flex gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">المستوى</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {formatEducationLevel(student.educationLevel, student.grade)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">الرقم</p>
                <p className="text-base font-bold text-blue-600 dark:text-blue-400">{student.id}</p>
              </div>
            </div>

            {getSubjectNames().length > 0 && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">المواد</p>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {getSubjectNames().slice(0, 3).join(' • ')}
                  {getSubjectNames().length > 3 && (
                    <span className="text-blue-600 dark:text-blue-400"> و {getSubjectNames().length - 3} أخرى</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Photo and QR */}
          <div className="w-32 flex flex-col items-center space-y-4">
            {/* Photo */}
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded border-2 border-gray-300 dark:border-gray-500 flex items-center justify-center">
              <div className="w-10 h-10 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
            </div>
            
            {/* QR Code */}
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded border">
              {isGenerating ? (
                <div className="w-16 h-16 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-gray-400 animate-pulse" />
                </div>
              ) : qrCodeImage ? (
                <img src={qrCodeImage} alt="QR Code" className="w-16 h-16" />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-600">
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