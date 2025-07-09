import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
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
  const { user } = useAuth();
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

    setLoading(true);
    try {
      await addDoc(collection(db, 'suggestions'), {
        userId: user.id,
        title,
        content,
        category,
        status: 'pending',
        createdAt: new Date(),
      });

      toast({ title: 'تم إرسال الاقتراح بنجاح!' });
      setTitle('');
      setContent('');
      setCategory('');
    } catch (error) {
      toast({ 
        title: 'خطأ في إرسال الاقتراح',
        description: 'يرجى المحاولة مرة أخرى',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

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
              <Select value={category} onValueChange={setCategory} required>
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
