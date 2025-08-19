import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb } from 'lucide-react';

export default function Suggestions() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const categories = [
    { value: 'app', label: 'تحسين التطبيق' },
    { value: 'content', label: 'المحتوى التعليمي' },
    { value: 'services', label: 'الخدمات' },
    { value: 'other', label: 'أخرى' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Client-side validation
    if (!title.trim()) {
      toast({ 
        title: 'خطأ في البيانات',
        description: 'العنوان مطلوب',
        variant: 'destructive'
      });
      return;
    }
    
    if (!content.trim()) {
      toast({ 
        title: 'خطأ في البيانات',
        description: 'المحتوى مطلوب',
        variant: 'destructive'
      });
      return;
    }
    
    if (!category) {
      toast({ 
        title: 'خطأ في البيانات',
        description: 'الفئة مطلوبة',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      console.log('User context:', user);
      console.log('User role:', user?.role);
      console.log('User schoolId:', user?.schoolId);
      console.log('Submitting suggestion:', { title: title.trim(), content: content.trim(), category });
      
      const suggestion = await apiRequest('POST', '/api/suggestions', {
        title: title.trim(),
        content: content.trim(),
        category
      });

      toast({ 
        title: 'تم إرسال الاقتراح بنجاح!',
        description: 'سيتم مراجعة اقتراحك قريباً'
      });
      setTitle('');
      setContent('');
      setCategory('');
    } catch (error: any) {
      console.error('Error submitting suggestion:', error);
      const errorMessage = error?.message || 'يرجى المحاولة مرة أخرى';
      toast({ 
        title: 'خطأ في إرسال الاقتراح',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="px-4 py-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">جاري التحقق من الهوية...</p>
      </div>
    );
  }

  // Show login message if user is not authenticated
  if (!user) {
    return (
      <div className="px-4 py-6 text-center">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="mr-3">
              <h3 className="text-sm font-medium text-yellow-800">
                يرجى تسجيل الدخول أولاً
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>يجب تسجيل الدخول إلى حسابك لإرسال الاقتراحات</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">صندوق الاقتراحات</h2>
      
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-lg">شاركنا اقتراحاتك</CardTitle>
          <p className="text-gray-600 text-sm">نحن نقدر آراءك ونسعى لتحسين خدماتنا</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">العنوان</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="اكتب عنوان الاقتراح"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="content">التفاصيل</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اكتب تفاصيل اقتراحك هنا..."
                rows={4}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category">الفئة</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر فئة الاقتراح" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-secondary"
              disabled={loading}
            >
              {loading ? 'جاري الإرسال...' : 'إرسال الاقتراح'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
