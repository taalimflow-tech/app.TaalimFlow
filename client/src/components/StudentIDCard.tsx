import { useState, useEffect } from "react";
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
    const scale = window.devicePixelRatio || 2;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 600;
    const height = 350;

    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;

    // Load Noto Sans Arabic font
    let fontFamily = "Arial, sans-serif";
    try {
      const font = new FontFace(
        "Noto Sans Arabic",
        "url(https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHmeibL0Y7Y.woff2)",
      );
      await font.load();
      document.fonts.add(font);
      fontFamily = '"Noto Sans Arabic", Arial, sans-serif';
    } catch (error) {
      console.warn("Failed to load Noto Sans Arabic. Using fallback.");
    }

    // Wait for font to be ready
    await new Promise((resolve) => {
      if (document.fonts.check(`16px ${fontFamily}`)) {
        resolve(true);
      } else {
        document.fonts.ready.then(resolve);
      }
    });

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 2;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

    // Header
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(0, 0, width, 60);

    // School Name
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 24px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.fillText(schoolInfo.name || "اسم المدرسة", width / 2, 20);

    ctx.font = `18px ${fontFamily}`;
    ctx.fillText("بطاقة هوية الطالب", width / 2, 45);

    // Photo Frame (Left)
    const photoX = 30;
    const photoY = 80;
    const photoSize = 90;

    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 2;
    ctx.strokeRect(photoX, photoY, photoSize, photoSize);
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(photoX, photoY, photoSize, photoSize);

    // Content Area (Right)
    const rightX = width - 30;

    // Student Name
    ctx.textAlign = "right";
    ctx.font = `bold 26px ${fontFamily}`;
    ctx.fillStyle = "#111827";
    const nameLines = splitTextToFit(
      ctx,
      student.name,
      400,
      `bold 26px ${fontFamily}`,
    );
    nameLines.forEach((line, i) => {
      ctx.fillText(line, rightX, 90 + i * 32);
    });

    // Type Badge
    const typeText = student.type === "student" ? "طالب" : "طفل";
    const typeWidth = ctx.measureText(typeText).width + 16;
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(rightX - typeWidth - 10, 90, typeWidth, 28);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 16px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.fillText(typeText, rightX - typeWidth / 2 - 10, 108);

    // Education Level
    ctx.textAlign = "right";
    ctx.font = `16px ${fontFamily}`;
    ctx.fillStyle = "#6b7280";
    ctx.fillText("المستوى:", rightX, 140);

    ctx.font = `bold 16px ${fontFamily}`;
    ctx.fillStyle = "#1f2937";
    ctx.fillText(
      formatEducationLevel(student.educationLevel, student.grade),
      rightX,
      162,
    );

    // ID Number
    ctx.font = `16px ${fontFamily}`;
    ctx.fillStyle = "#6b7280";
    ctx.fillText("الرقم:", rightX - 150, 140);

    ctx.font = `bold 18px ${fontFamily}`;
    ctx.fillStyle = "#2563eb";
    ctx.fillText(`#${student.id}`, rightX - 150, 162);

    // Subjects
    const subjectNames = getSubjectNames();
    if (subjectNames.length > 0) {
      ctx.textAlign = "right";
      ctx.font = `16px ${fontFamily}`;
      ctx.fillStyle = "#6b7280";
      ctx.fillText("المواد:", rightX, 200);

      ctx.font = `14px ${fontFamily}`;
      ctx.fillStyle = "#374151";
      const maxSubjectWidth = 400;
      const subjectsText = subjectNames.slice(0, 2).join(" • ");
      const wrappedSubjects = splitTextToFit(
        ctx,
        subjectsText,
        maxSubjectWidth,
        `14px ${fontFamily}`,
      );
      wrappedSubjects.forEach((line, i) => {
        ctx.fillText(line, rightX, 222 + i * 20);
      });

      if (subjectNames.length > 2) {
        ctx.fillStyle = "#2563eb";
        ctx.fillText(
          `+ ${subjectNames.length - 2} مواد أخرى`,
          rightX,
          222 + wrappedSubjects.length * 20,
        );
      }
    }

    // QR Code
    const qrX = 30;
    const qrY = 250;
    const qrSize = 120;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX, qrY, qrSize, qrSize);

    // Draw Profile Image
    if (student.profilePicture) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(photoX, photoY, photoSize, photoSize);
        ctx.clip();
        ctx.drawImage(img, photoX, photoY, photoSize, photoSize);
        ctx.restore();
        drawQR();
      };
      img.src = student.profilePicture;
    } else {
      ctx.fillStyle = "#9ca3af";
      ctx.font = `36px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.fillText("👤", photoX + photoSize / 2, photoY + photoSize / 2 - 10);
      drawQR();
    }

    function drawQR() {
      if (!ctx) return;

      if (qrCodeImage) {
        const qrImg = new Image();
        qrImg.onload = () => {
          ctx.drawImage(qrImg, qrX + 8, qrY + 8, qrSize - 16, qrSize - 16);
          downloadImage();
        };
        qrImg.src = qrCodeImage;
      } else {
        ctx.fillStyle = "#9ca3af";
        ctx.font = `14px ${fontFamily}`;
        ctx.textAlign = "center";
        ctx.fillText("QR Code", qrX + qrSize / 2, qrY + qrSize / 2);
        downloadImage();
      }
    }

    function downloadImage() {
      const link = document.createElement("a");
      link.download = `بطاقة_طالب_${student.name.replace(/\s+/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Text wrapping helper
  const splitTextToFit = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    font: string,
  ): string[] => {
    ctx.font = font;
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative bg-white border-2 border-gray-300 rounded-xl shadow-lg overflow-hidden">
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
          <div className="absolute top-3 right-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <School className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-center pr-16">
            <h2 className="text-xl font-bold mb-1">
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

        <div className="p-3 border-t border-gray-200">
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
    </div>
  );
}
