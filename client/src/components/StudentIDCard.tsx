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
    // Create a canvas to draw the ID card (real ID card dimensions: 85.6mm x 53.98mm)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (ID card dimensions in pixels - 600x375 maintains aspect ratio)
    canvas.width = 600;
    canvas.height = 375;

    // Fill background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add main border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Add school header background
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(15, 15, canvas.width - 30, 60);

    // Add school name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(schoolInfo.name, canvas.width / 2, 40);
    ctx.font = '12px Arial';
    ctx.fillText('بطاقة هوية طالب', canvas.width / 2, 60);

    // Add student info section
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`الاسم: ${student.name}`, canvas.width - 140, 110);
    
    ctx.font = '12px Arial';
    ctx.fillText(`المستوى: ${formatEducationLevel(student.educationLevel, student.grade)}`, canvas.width - 140, 135);
    ctx.fillText(`الرقم: ${student.id}`, canvas.width - 140, 155);
    ctx.fillText(`النوع: ${student.type === 'student' ? 'طالب' : 'طفل'}`, canvas.width - 140, 175);

    // Add subjects if available
    const subjectNames = getSubjectNames();
    if (subjectNames.length > 0) {
      ctx.fillText('المواد المسجلة:', canvas.width - 140, 200);
      subjectNames.slice(0, 2).forEach((subject, index) => {
        ctx.font = '10px Arial';
        ctx.fillText(`• ${subject}`, canvas.width - 140, 220 + (index * 15));
      });
      if (subjectNames.length > 2) {
        ctx.fillText(`+${subjectNames.length - 2} أخرى`, canvas.width - 140, 250);
      }
    }

    // Add QR code if available
    if (qrCodeImage) {
      const qrImg = new Image();
      qrImg.onload = () => {
        // QR code positioned on the left side
        ctx.drawImage(qrImg, 30, 100, 100, 100);
        
        // Add QR code label
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('رمز التحقق', 80, 220);
        
        // Download the canvas as image
        const link = document.createElement('a');
        link.download = `student_id_${student.name.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png', 0.9);
        link.click();
      };
      qrImg.src = qrCodeImage;
    } else {
      // Download without QR code
      const link = document.createElement('a');
      link.download = `student_id_${student.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png', 0.9);
      link.click();
    }
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