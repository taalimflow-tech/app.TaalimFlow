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

      // Check if we're on a small screen (mobile/tablet)
      const isSmallScreen = window.innerWidth < 1024; // lg breakpoint
      
      // Adjust dimensions based on rotation
      const captureWidth = isSmallScreen ? 350 : 600;
      const captureHeight = isSmallScreen ? 600 : 350;

      // Generate the canvas
      const canvas = await window.html2canvas(cardRef.current, {
        width: captureWidth,
        height: captureHeight,
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
    <div className="w-full max-w-4xl mx-auto px-2 py-8 lg:py-4">
      <div className="flex justify-center items-center min-h-[600px] lg:min-h-[350px]">
        <div 
          ref={cardRef}
          className="relative bg-white border-2 border-gray-300 rounded-xl shadow-lg overflow-hidden transform lg:transform-none rotate-90 lg:rotate-0 transition-transform duration-300"
          style={{ 
            fontFamily: "'Noto Sans Arabic', Arial, sans-serif",
            width: '600px',
            height: '350px'
          }}
        >
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-20 h-20 opacity-10">
          <div className="absolute top-2 left-2">
            <Star className="w-4 h-4 text-blue-600 transform rotate-12" />
          </div>
        </div>

        <div className="absolute bottom-0 right-0 w-20 h-20 opacity-10">
          <div className="absolute bottom-2 right-2">
            <Award className="w-4 h-4 text-blue-600 transform rotate-45" />
          </div>
        </div>

        {/* Header */}
        <div className="bg-blue-600 text-white p-4 relative">
          <div className="absolute top-2 right-2">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <School className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-center pr-20">
            <h2 className="text-2xl font-bold mb-1">
              {schoolInfo.name || "اسم المدرسة"}
            </h2>
            <p className="text-sm opacity-90">بطاقة هوية الطالب</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex p-4 gap-4" dir="rtl">
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">الاسم</p>
                <p className="text-lg font-bold text-gray-900">
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">المستوى</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatEducationLevel(student.educationLevel, student.grade)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">الرقم</p>
                <p className="text-sm font-bold text-blue-600">
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

          <div className="w-32 flex flex-col items-center space-y-3">
            <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-200">
              {student.profilePicture ? (
                <img
                  src={student.profilePicture}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="bg-white p-2 rounded border">
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
