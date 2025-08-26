import { useState, useEffect, useRef } from "react";

// Extend Window interface for html2canvas
declare global {
  interface Window {
    html2canvas: any;
  }
}
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  QrCode,
  School,
  Star,
  Shield,
  Award,
  GraduationCap,
  User,
} from "lucide-react";
import QRCode from "qrcode";

interface Student {
  id: number;
  name: string;
  educationLevel: string;
  grade: string;
  selectedSubjects?: string[];
  type: "student" | "child";
  profilePicture?: string;
}

interface SchoolInfo {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  nameAr: string;
}

interface StudentIDCardProps {
  student: Student;
  schoolInfo: SchoolInfo;
  subjects?: Subject[];
}

// Helper function to format education level
const formatEducationLevel = (level: string, grade: string) => {
  const levels: Record<string, string> = {
    elementary: "الابتدائية",
    middle: "المتوسطة",
    high: "الثانوية",
  };
  return `${levels[level] || level} - الصف ${grade}`;
};

export function StudentIDCard({
  student,
  schoolInfo,
  subjects = [],
}: StudentIDCardProps) {
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Generate QR code data
  const generateQRCodeData = () => {
    return `${student.type}:${student.id}:${schoolInfo.id}:verified`;
  };

  // Get subject names from IDs
  const getSubjectNames = () => {
    if (!student.selectedSubjects || student.selectedSubjects.length === 0)
      return [];

    return student.selectedSubjects.map((id) => {
      const subject = subjects.find((s) => s.id.toString() === id);
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
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrCodeImage(qrImage);
      } catch (error) {
        console.error("Error generating QR code:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateQRCode();
  }, [student.id, student.type, schoolInfo.id]);

  const downloadIDCard = async () => {
    if (!cardRef.current) return;

    try {
      // Load html2canvas from CDN if not already loaded
      if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      // Generate the canvas
      const canvas = await window.html2canvas(cardRef.current, {
        width: 600,
        height: 350,
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      // Convert to blob and download
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `بطاقة_طالب_${student.name.replace(/\s+/g, '_')}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Screenshot failed:', error);
      alert('خطأ في تحميل البطاقة. الرجاء المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2">
      <div 
        ref={cardRef}
        className="relative bg-white border-2 border-gray-300 rounded-xl shadow-lg overflow-hidden w-full aspect-[12/7]"
        style={{ 
          fontFamily: "'Noto Sans Arabic', Arial, sans-serif",
          maxWidth: '600px',
          margin: '0 auto'
        }}
      >
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 opacity-10">
          <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 transform rotate-12" />
          </div>
        </div>

        <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 opacity-10">
          <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2">
            <Award className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 transform rotate-45" />
          </div>
        </div>

        {/* Header */}
        <div className="bg-blue-600 text-white p-2 sm:p-3 md:p-4 relative">
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <School className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 text-white" />
            </div>
          </div>
          <div className="text-center pr-12 sm:pr-16 md:pr-20">
            <h2 className="text-sm sm:text-lg md:text-2xl font-bold mb-1">
              {schoolInfo.name || "اسم المدرسة"}
            </h2>
            <p className="text-xs sm:text-sm opacity-90">بطاقة هوية الطالب</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex p-2 sm:p-3 md:p-4 gap-2 sm:gap-3 md:gap-4" dir="rtl">
          <div className="flex-1 space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">الاسم</p>
                <p className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
                  {student.name}
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-bold bg-blue-600 text-white"
              >
                {student.type === "student" ? "طالب" : "طفل"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">المستوى</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900">
                  {formatEducationLevel(student.educationLevel, student.grade)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">الرقم</p>
                <p className="text-xs sm:text-sm font-bold text-blue-600">
                  # {student.id}
                </p>
              </div>
            </div>

            {getSubjectNames().length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-1">المواد</p>
                <p className="text-xs text-gray-700">
                  {getSubjectNames().slice(0, 3).join(" • ")}
                  {getSubjectNames().length > 3 && (
                    <span className="text-blue-600">
                      {" "}
                      و {getSubjectNames().length - 3} أخرى
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="w-20 sm:w-24 md:w-32 flex flex-col items-center space-y-2 sm:space-y-3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-200">
              {student.profilePicture ? (
                <img
                  src={student.profilePicture}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="bg-white p-1 sm:p-2 rounded border">
              {isGenerating ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center">
                  <QrCode className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-400 animate-pulse" />
                </div>
              ) : qrCodeImage ? (
                <img src={qrCodeImage} alt="QR Code" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24" />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center">
                  <QrCode className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Download Button - Outside the card */}
      <div className="mt-4">
        <button
          onClick={downloadIDCard}
          disabled={isGenerating}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
        >
          <Download className="w-4 h-4 mr-2" />
          تحميل بطاقة الهوية
        </button>
      </div>
    </div>
  );
}
