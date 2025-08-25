import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, QrCode } from 'lucide-react';
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
    // Create a canvas to draw the ID card
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (ID card dimensions)
    canvas.width = 400;
    canvas.height = 250;

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    // Add school header
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(schoolInfo.name, canvas.width / 2, 30);

    // Add student info
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`الاسم: ${student.name}`, canvas.width - 20, 60);
    ctx.fillText(`المستوى: ${formatEducationLevel(student.educationLevel, student.grade)}`, canvas.width - 20, 80);
    ctx.fillText(`النوع: ${student.type === 'student' ? 'طالب' : 'طفل'}`, canvas.width - 20, 100);

    // Add subjects (first 3)
    const subjectNames = getSubjectNames();
    if (subjectNames.length > 0) {
      ctx.fillText('المواد:', canvas.width - 20, 130);
      subjectNames.slice(0, 3).forEach((subject, index) => {
        ctx.font = '12px Arial';
        ctx.fillText(`• ${subject}`, canvas.width - 20, 150 + (index * 15));
      });
      if (subjectNames.length > 3) {
        ctx.fillText(`+${subjectNames.length - 3} أخرى`, canvas.width - 20, 195);
      }
    }

    // Add QR code if available
    if (qrCodeImage) {
      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.drawImage(qrImg, 20, 60, 120, 120);
        
        // Download the canvas as image
        const link = document.createElement('a');
        link.download = `student_id_${student.name.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      qrImg.src = qrCodeImage;
    } else {
      // Download without QR code
      const link = document.createElement('a');
      link.download = `student_id_${student.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <Card className="w-full max-w-md bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-lg">
      <CardContent className="p-6">
        {/* School Header */}
        <div className="text-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{schoolInfo.name}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">بطاقة هوية طالب</p>
        </div>

        <div className="flex gap-4" dir="rtl">
          {/* Student Info */}
          <div className="flex-1 space-y-3">
            <div>
              <Badge 
                className={`text-xs ${
                  student.type === 'student' 
                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}
              >
                {student.type === 'student' ? 'طالب' : 'طفل'}
              </Badge>
            </div>
            
            <div>
              <p className="text-sm font-semibold text-gray-900">الاسم:</p>
              <p className="text-sm text-gray-700">{student.name}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">المستوى:</p>
              <p className="text-sm text-gray-700">
                {formatEducationLevel(student.educationLevel, student.grade)}
              </p>
            </div>

            {/* Selected Subjects */}
            {getSubjectNames().length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">المواد:</p>
                <div className="space-y-1">
                  {getSubjectNames().slice(0, 3).map((subject, index) => (
                    <p key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      • {subject}
                    </p>
                  ))}
                  {getSubjectNames().length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{getSubjectNames().length - 3} مادة أخرى
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center space-y-2">
            {isGenerating ? (
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <QrCode className="w-8 h-8 text-gray-400 animate-pulse" />
              </div>
            ) : qrCodeImage ? (
              <img 
                src={qrCodeImage} 
                alt="QR Code" 
                className="w-24 h-24 border border-gray-200 rounded-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <QrCode className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <p className="text-xs text-gray-500 text-center">رمز التحقق</p>
          </div>
        </div>

        {/* Download Button */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <Button
            onClick={downloadIDCard}
            size="sm"
            variant="outline"
            className="w-full flex items-center gap-2 text-xs"
          >
            <Download className="w-4 h-4" />
            تحميل بطاقة الهوية
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}