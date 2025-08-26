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
    // Real ID card dimensions: 85.6mm x 53.98mm (aspect ratio ~1.6:1)
    <Card className="w-full max-w-2xl bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-xl" style={{ aspectRatio: '1.6/1' }}>
      <CardContent className="p-0 h-full">
        {/* School Header with Logo */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-4 text-white rounded-t-lg">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <School className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold">{schoolInfo.name}</h2>
              <p className="text-xs opacity-90">بطاقة هوية طالب</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex h-full" dir="rtl">
          {/* Student Information Section */}
          <div className="flex-1 p-4 space-y-2">
            {/* Student Type Badge */}
            <div className="mb-3">
              <Badge 
                className={`text-xs font-semibold ${
                  student.type === 'student' 
                    ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300'
                }`}
              >
                {student.type === 'student' ? 'طالب' : 'طفل'}
              </Badge>
            </div>
            
            {/* Student Details */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">الاسم الكامل</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{student.name}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">المستوى الدراسي</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {formatEducationLevel(student.educationLevel, student.grade)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">رقم الطالب</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 font-mono">{student.id}</p>
              </div>

              {/* Selected Subjects */}
              {getSubjectNames().length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">المواد المسجلة</p>
                  <div className="space-y-1">
                    {getSubjectNames().slice(0, 2).map((subject, index) => (
                      <p key={index} className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded text-right">
                        • {subject}
                      </p>
                    ))}
                    {getSubjectNames().length > 2 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        +{getSubjectNames().length - 2} مادة أخرى
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QR Code and Photo Section */}
          <div className="w-32 p-3 border-r border-gray-200 dark:border-gray-600 flex flex-col items-center justify-center space-y-3">
            {/* Student Photo Placeholder */}
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
              <div className="w-8 h-8 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
            </div>
            
            {/* QR Code */}
            <div className="flex flex-col items-center">
              {isGenerating ? (
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-gray-400 animate-pulse" />
                </div>
              ) : qrCodeImage ? (
                <img 
                  src={qrCodeImage} 
                  alt="QR Code" 
                  className="w-16 h-16 border border-gray-200 dark:border-gray-600 rounded"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">رمز التحقق</p>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="px-4 pb-3">
          <Button
            onClick={downloadIDCard}
            size="sm"
            variant="outline"
            className="w-full flex items-center gap-2 text-xs bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 dark:text-gray-100"
          >
            <Download className="w-4 h-4" />
            تحميل بطاقة الهوية
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}