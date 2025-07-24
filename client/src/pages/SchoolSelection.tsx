import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { School, Globe, Users, BookOpen, Calendar, ArrowRight, MapPin } from "lucide-react";
import { useLocation } from "wouter";

interface SchoolSelectionProps {
  schoolCode: string;
}

export default function SchoolSelection({ schoolCode }: SchoolSelectionProps) {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch school by code
  const { data: school, isLoading, error: fetchError } = useQuery({
    queryKey: ["/api/school/select", schoolCode],
    queryFn: async () => {
      const response = await fetch("/api/school/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolCode }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "فشل في جلب بيانات المدرسة");
      }

      return result.school;
    },
    retry: false,
  });

  const handleAccessSchool = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Set school context in session storage and local storage
      localStorage.setItem('selectedSchool', JSON.stringify(school));
      sessionStorage.setItem('currentSchoolId', school.id.toString());
      sessionStorage.setItem('schoolCode', school.code);
      
      // Navigate to login page with school context
      setLocation("/login");
    } catch (err) {
      setError("حدث خطأ في الوصول إلى المدرسة");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <School className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">جاري تحميل بيانات المدرسة...</p>
        </div>
      </div>
    );
  }

  if (fetchError || !school) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <School className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">المدرسة غير موجودة</CardTitle>
            <CardDescription>
              لم يتم العثور على مدرسة بالكود: <strong>{schoolCode}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {fetchError?.message || "تأكد من صحة رابط المدرسة أو تواصل مع الإدارة"}
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                onClick={() => setLocation("/")}
              >
                العودة إلى الصفحة الرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${school.primaryColor}20, ${school.secondaryColor}20)`
      }}
    >
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-6">
          <div 
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: school.primaryColor }}
          >
            <School className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl" style={{ color: school.primaryColor }}>
            {school.name}
          </CardTitle>
          <CardDescription className="text-lg">
            مرحباً بك في بوابة المدرسة الإلكترونية
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* School Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 bg-gray-50 rounded-lg">
              <School className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">كود المدرسة</p>
                <p className="font-semibold">{school.code}</p>
              </div>
            </div>

            {school.domain && (
              <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 bg-gray-50 rounded-lg">
                <Globe className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">النطاق</p>
                  <p className="font-semibold">{school.domain}</p>
                </div>
              </div>
            )}

            {school.location && (
              <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">الموقع</p>
                  <p className="font-semibold">{school.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">تاريخ التأسيس</p>
                <p className="font-semibold">{new Date(school.createdAt).toLocaleDateString('en-US')}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 bg-gray-50 rounded-lg">
              <div 
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: school.primaryColor }}
              />
              <div>
                <p className="text-sm text-gray-600">الألوان المميزة</p>
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: school.primaryColor }}
                  />
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: school.secondaryColor }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">الخدمات المتاحة</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2 rtl:space-x-reverse text-blue-700">
                <Users className="h-4 w-4" />
                <span>إدارة الطلاب والمعلمين</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse text-blue-700">
                <BookOpen className="h-4 w-4" />
                <span>المناهج والجداول الدراسية</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse text-blue-700">
                <Calendar className="h-4 w-4" />
                <span>الإعلانات والأحداث</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse text-blue-700">
                <Globe className="h-4 w-4" />
                <span>التواصل والرسائل</span>
              </div>
            </div>
          </div>

          {/* Access Button */}
          <div className="text-center pt-4">
            <Button
              size="lg"
              onClick={handleAccessSchool}
              disabled={loading}
              className="w-full"
              style={{ 
                backgroundColor: school.primaryColor,
                borderColor: school.primaryColor 
              }}
            >
              {loading ? "جاري الدخول..." : "دخول إلى المدرسة"}
              <ArrowRight className="h-5 w-5 mr-2" />
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            <p>نظام إدارة المدارس المتكامل</p>
            <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}