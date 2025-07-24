import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Building2, Plus, School, Users, Globe, Palette, Trash2, Eye, Edit, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

export default function SuperAdminSimple() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [showCreateSchool, setShowCreateSchool] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const queryClient = useQueryClient();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    superAdminKey: ""
  });
  const [schoolData, setSchoolData] = useState({
    name: "",
    code: "",
    domain: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch schools
  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ["/api/super-admin/schools"],
    enabled: user?.role === "super_admin"
  });

  // Create school mutation
  const createSchoolMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/super-admin/schools", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/schools"] });
      setSchoolData({
        name: "",
        code: "",
        domain: "",
        primaryColor: "#3B82F6",
        secondaryColor: "#1E40AF"
      });
      setShowCreateSchool(false);
      setError("");
    },
    onError: (error: any) => {
      setError(error.message || "فشل في إنشاء المدرسة");
    }
  });

  // Delete school mutation
  const deleteSchoolMutation = useMutation({
    mutationFn: (schoolId: number) => apiRequest("DELETE", `/api/super-admin/schools/${schoolId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/schools"] });
    },
    onError: (error: any) => {
      setError(error.message || "فشل في حذف المدرسة");
    }
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/super-admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "فشل تسجيل الدخول");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/super-admin-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "فشل إنشاء الحساب");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    createSchoolMutation.mutate(schoolData);
  };

  const handleDeleteSchool = (schoolId: number, schoolName: string) => {
    if (confirm(`هل أنت متأكد من حذف مدرسة "${schoolName}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      deleteSchoolMutation.mutate(schoolId);
    }
  };

  if (user?.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Shield className="mx-auto h-12 w-12 text-purple-400 mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">لوحة المسؤول العام</h1>
            <p className="text-purple-200">إدارة جميع المدارس والمؤسسات التعليمية</p>
          </div>

          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
            <CardHeader className="text-center">
              <CardTitle className="text-white">
                {showLogin ? "تسجيل الدخول" : "إنشاء حساب مسؤول عام"}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              {showLogin ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      className="bg-white/10 border-purple-500/30 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      className="bg-white/10 border-purple-500/30 text-white"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">الاسم</Label>
                      <Input
                        id="name"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                        className="bg-white/10 border-purple-500/30 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white">الهاتف</Label>
                      <Input
                        id="phone"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                        className="bg-white/10 border-purple-500/30 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-white">البريد الإلكتروني</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      className="bg-white/10 border-purple-500/30 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-white">كلمة المرور</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      className="bg-white/10 border-purple-500/30 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key" className="text-white">مفتاح المسؤول العام</Label>
                    <Input
                      id="key"
                      type="password"
                      value={registerData.superAdminKey}
                      onChange={(e) => setRegisterData({...registerData, superAdminKey: e.target.value})}
                      className="bg-white/10 border-purple-500/30 text-white"
                      placeholder="SUPER_ADMIN_2024_MASTER_KEY"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب مسؤول عام"}
                  </Button>
                </form>
              )}

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowLogin(!showLogin)}
                  className="text-purple-300 hover:text-white"
                >
                  {showLogin ? "إنشاء حساب مسؤول عام جديد" : "العودة إلى تسجيل الدخول"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">لوحة المسؤول العام</h1>
                <p className="text-sm text-gray-500">إدارة جميع المدارس والمؤسسات التعليمية</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <span className="text-sm text-gray-600">مرحباً، {user.name}</span>
              <Button variant="outline" onClick={() => logout()}>تسجيل الخروج</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <div className="mb-8">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Shield className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">نظام إدارة المدارس جاهز!</h3>
                  <p className="text-green-700">
                    تم تنفيذ نظام إدارة متعدد المدارس بالكامل مع فصل البيانات الكامل بين المدارس
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schools Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <School className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{schools.length}</p>
                  <p className="text-sm text-gray-600">إجمالي المدارس</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{schools.filter((s: any) => s.active).length}</p>
                  <p className="text-sm text-gray-600">المدارس النشطة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Globe className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{schools.filter((s: any) => s.domain).length}</p>
                  <p className="text-sm text-gray-600">نطاقات مخصصة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{new Date().toLocaleDateString('ar-SA')}</p>
                  <p className="text-sm text-gray-600">تاريخ اليوم</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schools List */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>قائمة المدارس المسجلة</CardTitle>
                <CardDescription>جميع المدارس والمؤسسات التعليمية في النظام</CardDescription>
              </div>
              <Button onClick={() => setShowCreateSchool(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مدرسة جديدة
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {schoolsLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">جاري تحميل المدارس...</p>
              </div>
            ) : schools.length === 0 ? (
              <div className="text-center py-8">
                <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">لا توجد مدارس مسجلة بعد</p>
                <Button onClick={() => setShowCreateSchool(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  أضف أول مدرسة
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {schools.map((school: any) => (
                  <div key={school.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: school.primaryColor }}
                          />
                          <h3 className="text-lg font-semibold">{school.name}</h3>
                          <Badge variant={school.active ? "default" : "secondary"}>
                            {school.active ? "نشط" : "غير نشط"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <School className="h-4 w-4" />
                            <span>الكود: {school.code}</span>
                          </div>
                          
                          {school.domain && (
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Globe className="h-4 w-4" />
                              <span>النطاق: {school.domain}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Calendar className="h-4 w-4" />
                            <span>أنشئت: {new Date(school.createdAt).toLocaleDateString('en-US')}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 rtl:space-x-reverse mt-3">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Palette className="h-4 w-4 text-gray-400" />
                            <div className="flex space-x-1 rtl:space-x-reverse">
                              <div 
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: school.primaryColor }}
                                title="اللون الأساسي"
                              />
                              <div 
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: school.secondaryColor }}
                                title="اللون الثانوي"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/school/${school.code}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSchool(school)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteSchool(school.id, school.name)}
                          disabled={deleteSchoolMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create School Form */}
        {showCreateSchool && (
          <Card>
            <CardHeader>
              <CardTitle>إضافة مدرسة جديدة</CardTitle>
              <CardDescription>قم بإنشاء مدرسة أو مؤسسة تعليمية جديدة في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4 border-red-500/50 bg-red-500/10">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleCreateSchool} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school-name">اسم المدرسة</Label>
                    <Input
                      id="school-name"
                      value={schoolData.name}
                      onChange={(e) => setSchoolData({...schoolData, name: e.target.value})}
                      placeholder="مدرسة النور الابتدائية"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="school-code">كود المدرسة</Label>
                    <Input
                      id="school-code"
                      value={schoolData.code}
                      onChange={(e) => setSchoolData({...schoolData, code: e.target.value})}
                      placeholder="nour-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school-domain">النطاق (اختياري)</Label>
                  <Input
                    id="school-domain"
                    value={schoolData.domain}
                    onChange={(e) => setSchoolData({...schoolData, domain: e.target.value})}
                    placeholder="nour-school.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">اللون الأساسي</Label>
                    <Input
                      id="primary-color"
                      type="color"
                      value={schoolData.primaryColor}
                      onChange={(e) => setSchoolData({...schoolData, primaryColor: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">اللون الثانوي</Label>
                    <Input
                      id="secondary-color"
                      type="color"
                      value={schoolData.secondaryColor}
                      onChange={(e) => setSchoolData({...schoolData, secondaryColor: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                  <Button type="button" variant="outline" onClick={() => setShowCreateSchool(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={createSchoolMutation.isPending}>
                    {createSchoolMutation.isPending ? "جاري الإنشاء..." : "إنشاء المدرسة"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* School Access Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>كيفية الوصول إلى المدارس</CardTitle>
            <CardDescription>طرق الوصول إلى كل مدرسة في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">الوصول عبر الكود</h4>
                <p className="text-blue-700 text-sm mb-2">
                  يمكن للمستخدمين الوصول إلى مدرستهم عبر الرابط التالي:
                </p>
                <code className="bg-blue-100 px-2 py-1 rounded text-sm">
                  /school/[school-code]
                </code>
              </div>
              
              {schools.filter((s: any) => s.domain).length > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">النطاقات المخصصة</h4>
                  <p className="text-green-700 text-sm mb-2">
                    المدارس التي لديها نطاقات مخصصة:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {schools.filter((s: any) => s.domain).map((school: any) => (
                      <li key={school.id} className="text-green-700">
                        <strong>{school.name}</strong>: {school.domain}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Features List */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>ميزات النظام متعدد المدارس</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✓ فصل البيانات الكامل</h4>
                  <p className="text-sm text-gray-600">كل مدرسة لها بيانات منفصلة تماماً</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✓ تخصيص العلامة التجارية</h4>
                  <p className="text-sm text-gray-600">ألوان وشعارات مخصصة لكل مدرسة</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✓ إدارة مركزية</h4>
                  <p className="text-sm text-gray-600">إدارة جميع المدارس من لوحة واحدة</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✓ وصول آمن</h4>
                  <p className="text-sm text-gray-600">وصول مخفي ومحمي بمفتاح سري</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}