import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calculator, Plus, Minus, RotateCcw, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FinancialBalance {
  totalGains: number;
  totalLosses: number;
  netBalance: number;
}

export default function FinancialReports() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<FinancialBalance>({ totalGains: 0, totalLosses: 0, netBalance: 0 });
  
  // States for gains and losses inputs
  const [gainAmount, setGainAmount] = useState('');
  const [gainRemarks, setGainRemarks] = useState('');
  const [lossAmount, setLossAmount] = useState('');
  const [lossRemarks, setLossRemarks] = useState('');
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);

  // Fetch current financial balance
  const fetchBalance = async () => {
    if (loading || user?.role !== 'admin') {
      console.log('Skipping balance fetch - user not authenticated as admin');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await apiRequest('GET', '/api/financial-balance');

      if (response.ok) {
        const data = await response.json();
        setBalance(data);
      } else {
        const error = await response.json();
        toast({
          title: "خطأ في تحميل الرصيد",
          description: error.error || "تعذر تحميل الرصيد المالي",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      if (!loading && user?.role === 'admin') {
        toast({
          title: "خطأ في الاتصال",
          description: "تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitGainEntry = async () => {
    if (!gainAmount || parseFloat(gainAmount) <= 0) {
      toast({
        title: "خطأ في المبلغ",
        description: "يرجى إدخال مبلغ صحيح للأرباح",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmittingEntry(true);
      const response = await apiRequest('POST', '/api/financial-entries', {
        type: 'gain',
        amount: parseFloat(gainAmount),
        remarks: gainRemarks || 'ربح',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
      });

      if (response.ok) {
        toast({
          title: "تم إضافة الربح",
          description: `تم تسجيل ربح بقيمة ${gainAmount} دج`,
          variant: "default"
        });
        setGainAmount('');
        setGainRemarks('');
        fetchBalance(); // Refresh the balance
      } else {
        const error = await response.json();
        toast({
          title: "خطأ في تسجيل الربح",
          description: error.error || "تعذر تسجيل الربح",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting gain entry:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  const handleSubmitLossEntry = async () => {
    if (!lossAmount || parseFloat(lossAmount) <= 0) {
      toast({
        title: "خطأ في المبلغ",
        description: "يرجى إدخال مبلغ صحيح للخسائر",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmittingEntry(true);
      const response = await apiRequest('POST', '/api/financial-entries', {
        type: 'loss',
        amount: parseFloat(lossAmount),
        remarks: lossRemarks || 'خسارة',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
      });

      if (response.ok) {
        toast({
          title: "تم إضافة الخسارة",
          description: `تم تسجيل خسارة بقيمة ${lossAmount} دج`,
          variant: "default"
        });
        setLossAmount('');
        setLossRemarks('');
        fetchBalance(); // Refresh the balance
      } else {
        const error = await response.json();
        toast({
          title: "خطأ في تسجيل الخسارة",
          description: error.error || "تعذر تسجيل الخسارة",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting loss entry:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  const handleResetBalance = async () => {
    if (!confirm('هل أنت متأكد من إعادة تعيين الرصيد المالي؟ سيتم حذف جميع الإدخالات المالية.')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/financial-balance/reset');

      if (response.ok) {
        toast({
          title: "تم إعادة تعيين الرصيد",
          description: "تم إعادة تعيين الرصيد المالي إلى الصفر",
          variant: "default"
        });
        setBalance({ totalGains: 0, totalLosses: 0, netBalance: 0 });
      } else {
        const error = await response.json();
        toast({
          title: "خطأ في إعادة التعيين",
          description: error.error || "تعذر إعادة تعيين الرصيد",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error resetting balance:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [loading, user]);

  // Auth guards
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">يجب تسجيل الدخول كمدير للوصول إلى التقارير المالية</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calculator className="h-8 w-8" />
          الحاسبة المالية
        </h1>
      </div>

      {/* Current Balance Display */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            الرصيد الحالي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-100 dark:bg-green-900 rounded-lg">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {balance.totalGains.toLocaleString()} دج
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">إجمالي الأرباح</div>
            </div>
            
            <div className="text-center p-4 bg-red-100 dark:bg-red-900 rounded-lg">
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {balance.totalLosses.toLocaleString()} دج
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">إجمالي الخسائر</div>
            </div>
            
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <div className={`text-2xl font-bold ${balance.netBalance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                {balance.netBalance.toLocaleString()} دج
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">الرصيد الصافي</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add Gain */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Plus className="h-5 w-5" />
              إضافة ربح
            </CardTitle>
            <CardDescription>
              تسجيل دخل إيجابي (مكاسب)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="gainAmount">المبلغ (دج)</Label>
              <Input
                id="gainAmount"
                type="number"
                placeholder="أدخل مبلغ الربح"
                value={gainAmount}
                onChange={(e) => setGainAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="gainRemarks">ملاحظات (اختياري)</Label>
              <Textarea
                id="gainRemarks"
                placeholder="تفاصيل الربح..."
                value={gainRemarks}
                onChange={(e) => setGainRemarks(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              onClick={handleSubmitGainEntry}
              disabled={isSubmittingEntry || !gainAmount}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isSubmittingEntry ? 'جاري الحفظ...' : 'إضافة الربح'}
            </Button>
          </CardContent>
        </Card>

        {/* Add Loss */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Minus className="h-5 w-5" />
              إضافة خسارة
            </CardTitle>
            <CardDescription>
              تسجيل مصروف أو خسارة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="lossAmount">المبلغ (دج)</Label>
              <Input
                id="lossAmount"
                type="number"
                placeholder="أدخل مبلغ الخسارة"
                value={lossAmount}
                onChange={(e) => setLossAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="lossRemarks">ملاحظات (اختياري)</Label>
              <Textarea
                id="lossRemarks"
                placeholder="تفاصيل الخسارة..."
                value={lossRemarks}
                onChange={(e) => setLossRemarks(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              onClick={handleSubmitLossEntry}
              disabled={isSubmittingEntry || !lossAmount}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Minus className="h-4 w-4 mr-2" />
              {isSubmittingEntry ? 'جاري الحفظ...' : 'إضافة الخسارة'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reset Balance */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <RotateCcw className="h-5 w-5" />
            إعادة تعيين الرصيد
          </CardTitle>
          <CardDescription>
            حذف جميع الإدخالات المالية وإعادة تعيين الرصيد إلى الصفر
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleResetBalance}
            disabled={isLoading}
            variant="destructive"
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {isLoading ? 'جاري إعادة التعيين...' : 'إعادة تعيين الرصيد'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}