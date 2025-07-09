import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocation, Link } from 'wouter';
import { Plus, Trash2 } from 'lucide-react';

interface Child {
  name: string;
  educationLevel: string;
  grade: string;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [children, setChildren] = useState<Child[]>([{ name: '', educationLevel: '', grade: '' }]);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const educationLevels = {
    'الابتدائي': [
      '5 سنوات',
      'السنة الأولى ابتدائي',
      'السنة الثانية ابتدائي',
      'السنة الثالثة ابتدائي',
      'السنة الرابعة ابتدائي',
      'السنة الخامسة ابتدائي'
    ],
    'المتوسط': [
      'السنة الأولى متوسط',
      'السنة الثانية متوسط',
      'السنة الثالثة متوسط',
      'السنة الرابعة متوسط'
    ],
    'الثانوي': [
      'السنة الأولى ثانوي',
      'السنة الثانية ثانوي',
      'السنة الثالثة ثانوي'
    ]
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast({ title: 'تم تسجيل الدخول بنجاح' });
    } catch (error) {
      toast({ 
        title: 'خطأ في تسجيل الدخول', 
        description: error instanceof Error ? error.message : 'تأكد من صحة البيانات المدخلة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addChild = () => {
    if (children.length < 5) {
      setChildren([...children, { name: '', educationLevel: '', grade: '' }]);
    }
  };

  const removeChild = (index: number) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index));
    }
  };

  const updateChild = (index: number, field: keyof Child, value: string) => {
    const updatedChildren = [...children];
    updatedChildren[index][field] = value;
    
    // Reset grade when education level changes
    if (field === 'educationLevel') {
      updatedChildren[index].grade = '';
    }
    
    setChildren(updatedChildren);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate children data
    const validChildren = children.filter(child => 
      child.name.trim() && child.educationLevel && child.grade
    );
    
    if (validChildren.length === 0) {
      toast({ 
        title: 'خطأ في البيانات', 
        description: 'يجب إدخال بيانات طفل واحد على الأقل',
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }
    
    try {
      await register(email, password, name, phone, validChildren);
      toast({ title: 'تم إنشاء الحساب بنجاح' });
    } catch (error) {
      toast({ 
        title: 'خطأ في إنشاء الحساب', 
        description: error instanceof Error ? error.message : 'تأكد من صحة البيانات المدخلة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-bg p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14l9-5-9-5-9 5 9 5z"></path>
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">مدرستي</CardTitle>
          <CardDescription>منصة التعلم الذكية</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="أدخل بريدك الإلكتروني"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="name">اسم ولي الأمر</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أدخل اسم ولي الأمر"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0555123456 أو +213555123456"
                    pattern="^(\+213|0)(5|6|7)[0-9]{8}$"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">رقم هاتف جزائري (يبدأ بـ 05، 06، أو 07)</p>
                </div>
                
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="أدخل بريدك الإلكتروني"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    required
                  />
                </div>
                
                {/* Children Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">بيانات الأطفال</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addChild}
                      disabled={children.length >= 5}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة طفل
                    </Button>
                  </div>
                  
                  {children.map((child, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">الطفل {index + 1}</h4>
                        {children.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeChild(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor={`child-name-${index}`}>اسم الطفل</Label>
                        <Input
                          id={`child-name-${index}`}
                          type="text"
                          value={child.name}
                          onChange={(e) => updateChild(index, 'name', e.target.value)}
                          placeholder="أدخل اسم الطفل"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`child-level-${index}`}>المرحلة التعليمية</Label>
                        <Select
                          value={child.educationLevel}
                          onValueChange={(value) => updateChild(index, 'educationLevel', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المرحلة التعليمية" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="الابتدائي">الابتدائي</SelectItem>
                            <SelectItem value="المتوسط">المتوسط</SelectItem>
                            <SelectItem value="الثانوي">الثانوي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {child.educationLevel && (
                        <div>
                          <Label htmlFor={`child-grade-${index}`}>السنة الدراسية</Label>
                          <Select
                            value={child.grade}
                            onValueChange={(value) => updateChild(index, 'grade', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر السنة الدراسية" />
                            </SelectTrigger>
                            <SelectContent>
                              {educationLevels[child.educationLevel as keyof typeof educationLevels]?.map((grade) => (
                                <SelectItem key={grade} value={grade}>
                                  {grade}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    يمكن تسجيل حتى 5 أطفال في الحساب الواحد
                  </p>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <a 
              href="/admin-login"
              className="text-sm text-gray-600 hover:text-primary underline cursor-pointer"
            >
              تسجيل دخول المديرين والمعلمين
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
