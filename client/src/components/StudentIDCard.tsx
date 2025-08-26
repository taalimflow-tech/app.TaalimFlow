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
    <div className="w-full max-w-4xl mx-auto">
      {/* Real ID card dimensions: 85.6mm x 53.98mm (aspect ratio ~1.6:1) */}
      <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-gray-700 overflow-hidden" style={{ aspectRatio: '1.6/1' }}>
        
        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-br-full"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-tl-full"></div>
        
        {/* School Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-700 dark:via-blue-800 dark:to-blue-900 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* School Logo */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <School className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white mb-1">{schoolInfo.name}</h1>
                <p className="text-blue-100 text-sm font-medium">بطاقة هوية الطالب</p>
              </div>
            </div>
            
            {/* Student Type Badge */}
            <div className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
              <span className="text-white font-semibold text-sm">
                {student.type === 'student' ? 'طالب' : 'طفل'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-full p-6" dir="rtl">
          {/* Student Information */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Name */}
              <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">الاسم الكامل</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{student.name}</p>
              </div>

              {/* Education Level and Student ID */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">المستوى الدراسي</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {formatEducationLevel(student.educationLevel, student.grade)}
                  </p>
                </div>
                
                <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">رقم الطالب</p>
                  <p className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono">{student.id}</p>
                </div>
              </div>

              {/* Subjects */}
              {getSubjectNames().length > 0 && (
                <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">المواد المسجلة</p>
                  <div className="grid grid-cols-1 gap-2">
                    {getSubjectNames().slice(0, 3).map((subject, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{subject}</p>
                      </div>
                    ))}
                    {getSubjectNames().length > 3 && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        و {getSubjectNames().length - 3} مواد أخرى
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Photo and QR Section */}
          <div className="w-48 flex flex-col items-center justify-center space-y-6 border-r border-gray-200 dark:border-gray-700 pr-6">
            {/* Student Photo */}
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-xl flex items-center justify-center border-4 border-white dark:border-gray-600 shadow-lg">
              <div className="w-12 h-12 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
            </div>
            
            {/* QR Code */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600">
              {isGenerating ? (
                <div className="w-20 h-20 flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-gray-400 animate-pulse" />
                </div>
              ) : qrCodeImage ? (
                <img 
                  src={qrCodeImage} 
                  alt="QR Code" 
                  className="w-20 h-20"
                />
              ) : (
                <div className="w-20 h-20 flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <p className="text-xs text-center text-gray-600 dark:text-gray-400 font-medium">رمز التحقق الرقمي</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
          <Button
            onClick={downloadIDCard}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Download className="w-4 h-4 mr-2" />
            تحميل بطاقة الهوية
          </Button>
        </div>
      </div>
    </div>
  );
}