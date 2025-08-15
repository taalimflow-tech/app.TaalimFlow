import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Minus, RotateCcw, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface FinancialEntry {
  id: number;
  type: 'gain' | 'loss';
  amount: string;
  remarks: string;
  year: number;
  month: number;
  createdAt: string;
}

export default function GainLossCalculator() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [entryType, setEntryType] = useState<'gain' | 'loss'>('gain');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  // Check if user is admin
  if (!loading && (!user || user.role !== 'admin')) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-lg mb-2">صلاحيات المدير مطلوبة</div>
            <div className="text-gray-600">تحتاج إلى صلاحيات المدير لاستخدام حاسبة الأرباح والخسائر</div>
            <div className="text-sm text-gray-500 mt-4">
              الحالة: {loading ? 'جاري التحميل...' : !user ? 'غير مسجل دخول' : `الدور: ${user.role}`}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-600">جاري التحميل...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get current date for entries
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Fetch financial entries
  const { data: entries = [], isLoading, error } = useQuery<FinancialEntry[]>({
    queryKey: ['/api', 'gain-loss-entries'],
    enabled: !!user && !loading && user.role === 'admin',
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Log any query errors
  if (error) {
    console.error('Query error:', error);
  }

  // Check if user needs to log in again
  React.useEffect(() => {
    if (error && error.message.includes('401')) {
      toast({
        title: "انتهت جلسة العمل",
        description: "يرجى تسجيل الدخول مرة أخرى",
        variant: "destructive",
      });
    }
  }, [error]);

  // Calculate current balance
  const currentBalance = (entries as FinancialEntry[]).reduce((total: number, entry: FinancialEntry) => {
    const entryAmount = parseFloat(entry.amount);
    return entry.type === 'gain' ? total + entryAmount : total - entryAmount;
  }, 0);

  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (entryData: any) => {
      console.log('Creating entry with data:', entryData);
      console.log('User session:', user);
      try {
        const response = await apiRequest('POST', '/api/gain-loss-entries', entryData);
        const result = await response.json();
        console.log('Success response:', result);
        return result;
      } catch (error) {
        console.error('Error in mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api', 'gain-loss-entries'] });
      setAmount('');
      setRemarks('');
      toast({
        title: "تم الحفظ",
        description: `تم إضافة ${entryType === 'gain' ? 'الربح' : 'الخسارة'} بنجاح`,
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: "خطأ",
        description: `حدث خطأ أثناء حفظ البيانات: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Reset balance mutation
  const resetBalanceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/gain-loss-entries/reset');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api', 'gain-loss-entries'] });
      toast({
        title: "تم إعادة التعيين",
        description: "تم إعادة تعيين الرصيد بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إعادة تعيين الرصيد",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }

    if (!remarks.trim()) {
      toast({
        title: "خطأ في البيانات", 
        description: "يرجى إدخال ملاحظات",
        variant: "destructive",
      });
      return;
    }

    createEntryMutation.mutate({
      type: entryType,
      amount: amount.trim(), // Send as string for decimal field
      remarks: remarks.trim(),
      year: currentYear,
      month: currentMonth,
    });
  };

  const handleReset = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
      resetBalanceMutation.mutate();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">جاري التحميل...</div>;
  }

  if (!user) {
    return <div className="text-center text-red-600">يرجى تسجيل الدخول</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
          <Calculator className="w-8 h-8 text-primary" />
          حاسبة الأرباح والخسائر
        </h1>
        <p className="text-gray-600">أداة بسيطة لتتبع الأرباح والخسائر المالية</p>
      </div>

      {/* Current Balance Display */}
      <Card className="border-2 border-primary/20 bg-gradient-to-l from-primary/5 to-primary/10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">الرصيد الحالي</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className={`text-4xl font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {currentBalance.toLocaleString('ar-DZ')} دج
          </div>
          <p className="text-sm text-gray-600 mt-2">
            النتيجة الصافية = إجمالي الدخل - إجمالي المصروفات
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              إضافة عملية جديدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Entry Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={entryType === 'gain' ? 'default' : 'outline'}
                  onClick={() => setEntryType('gain')}
                  className="h-12 flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  ربح (+)
                </Button>
                <Button
                  type="button"
                  variant={entryType === 'loss' ? 'default' : 'outline'}
                  onClick={() => setEntryType('loss')}
                  className="h-12 flex items-center gap-2"
                >
                  <TrendingDown className="w-4 h-4" />
                  خسارة (-)
                </Button>
              </div>

              {/* Amount Input */}
              <div>
                <Label htmlFor="amount">المبلغ (بالدينار الجزائري)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="text-lg"
                />
              </div>

              {/* Remarks Input */}
              <div>
                <Label htmlFor="remarks">الملاحظات</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="اكتب ملاحظات حول هذه العملية..."
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg"
                disabled={createEntryMutation.isPending}
              >
                {createEntryMutation.isPending ? 'جاري الحفظ...' : `إضافة ${entryType === 'gain' ? 'ربح' : 'خسارة'}`}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>العمليات الأخيرة</CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReset}
              disabled={resetBalanceMutation.isPending}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              إعادة تعيين
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">خطأ في تحميل البيانات</div>
                <div className="text-sm text-gray-500">
                  {error.message.includes('401') ? 'يرجى تسجيل الدخول مرة أخرى' : 'تحقق من الاتصال'}
                </div>
              </div>
            ) : (entries as FinancialEntry[]).length === 0 ? (
              <div className="text-center py-8 text-gray-500">لا توجد عمليات</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(entries as FinancialEntry[]).slice(0, 10).map((entry: FinancialEntry) => (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-lg border ${
                      entry.type === 'gain' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {entry.type === 'gain' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`font-medium ${
                          entry.type === 'gain' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {entry.type === 'gain' ? '+' : '-'}{parseFloat(entry.amount).toLocaleString('ar-DZ')} دج
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString('ar-DZ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{entry.remarks}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}