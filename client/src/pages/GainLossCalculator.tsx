import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, RotateCcw, Calculator, TrendingUp, TrendingDown, Filter } from 'lucide-react';
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
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');

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

  // Filter entries based on time filter
  const filteredEntries = React.useMemo(() => {
    if (timeFilter === 'all') return entries as FinancialEntry[];
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    
    return (entries as FinancialEntry[]).filter((entry: FinancialEntry) => {
      const entryDate = new Date(entry.createdAt);
      
      switch (timeFilter) {
        case 'today':
          return entryDate >= todayStart;
        case 'week':
          return entryDate >= weekStart;
        case 'month':
          return entryDate >= monthStart;
        case 'year':
          return entryDate >= yearStart;
        default:
          return true;
      }
    });
  }, [entries, timeFilter]);

  // Filter entries for balance calculation
  const balanceFilteredEntries = React.useMemo(() => {
    if (balanceFilter === 'all') return entries as FinancialEntry[];
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    
    return (entries as FinancialEntry[]).filter((entry: FinancialEntry) => {
      const entryDate = new Date(entry.createdAt);
      
      switch (balanceFilter) {
        case 'today':
          return entryDate >= todayStart;
        case 'week':
          return entryDate >= weekStart;
        case 'month':
          return entryDate >= monthStart;
        case 'year':
          return entryDate >= yearStart;
        default:
          return true;
      }
    });
  }, [entries, balanceFilter]);

  // Calculate current balance from all entries (not just filtered)
  const currentBalance = (entries as FinancialEntry[]).reduce((total: number, entry: FinancialEntry) => {
    const entryAmount = parseFloat(entry.amount);
    return entry.type === 'gain' ? total + entryAmount : total - entryAmount;
  }, 0);

  // Calculate filtered balance for transactions
  const filteredBalance = filteredEntries.reduce((total: number, entry: FinancialEntry) => {
    const entryAmount = parseFloat(entry.amount);
    return entry.type === 'gain' ? total + entryAmount : total - entryAmount;
  }, 0);

  // Calculate balance for balance card display
  const displayBalance = balanceFilteredEntries.reduce((total: number, entry: FinancialEntry) => {
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

  // Helper function to get filter label
  const getFilterLabel = () => {
    switch (timeFilter) {
      case 'today': return 'اليوم';
      case 'week': return 'هذا الأسبوع';
      case 'month': return 'هذا الشهر';
      case 'year': return 'هذا العام';
      default: return 'جميع الأوقات';
    }
  };

  // Helper function to get balance filter label
  const getBalanceFilterLabel = () => {
    switch (balanceFilter) {
      case 'today': return 'اليوم';
      case 'week': return 'هذا الأسبوع';
      case 'month': return 'هذا الشهر';
      case 'year': return 'هذا العام';
      default: return 'جميع الأوقات';
    }
  };

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
        <CardHeader className="space-y-4">
          <div className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              {balanceFilter === 'all' ? 'الرصيد الحالي' : `الرصيد لفترة: ${getBalanceFilterLabel()}`}
            </CardTitle>
          </div>
          
          {/* Balance Filter Section */}
          <div className="flex items-center justify-center gap-3 pt-2 border-t border-primary/20">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-gray-700">فلترة الرصيد:</span>
            <Select value={balanceFilter} onValueChange={(value: 'all' | 'today' | 'week' | 'month' | 'year') => setBalanceFilter(value)}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأوقات</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">هذا الأسبوع</SelectItem>
                <SelectItem value="month">هذا الشهر</SelectItem>
                <SelectItem value="year">هذا العام</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <div className={`text-4xl font-bold ${displayBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {displayBalance.toLocaleString('ar-DZ')} دج
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {balanceFilter === 'all' 
              ? 'النتيجة الصافية = إجمالي الدخل - إجمالي المصروفات'
              : `النتيجة الصافية لفترة ${getBalanceFilterLabel()}`
            }
          </p>
          {balanceFilter !== 'all' && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                الرصيد الإجمالي: {currentBalance >= 0 ? '+' : ''}{currentBalance.toLocaleString('ar-DZ')} دج
              </p>
            </div>
          )}
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
          <CardHeader className="space-y-4">
            <div className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">العمليات الأخيرة</CardTitle>
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
            </div>
            
            {/* Time Filter Section */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">فلترة حسب الفترة:</span>
              <Select value={timeFilter} onValueChange={(value: 'all' | 'today' | 'week' | 'month' | 'year') => setTimeFilter(value)}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأوقات</SelectItem>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="week">هذا الأسبوع</SelectItem>
                  <SelectItem value="month">هذا الشهر</SelectItem>
                  <SelectItem value="year">هذا العام</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {timeFilter === 'all' ? 'لا توجد عمليات' : `لا توجد عمليات في ${getFilterLabel()}`}
              </div>
            ) : (
              <>
                {/* Show filtered balance if different from total */}
                {timeFilter !== 'all' && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-blue-700 font-medium mb-1">الرصيد لفترة: {getFilterLabel()}</div>
                        <div className={`text-xl font-bold ${filteredBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {filteredBalance >= 0 ? '+' : ''}{filteredBalance.toLocaleString('ar-DZ')} دج
                        </div>
                      </div>
                      <div className="text-blue-500">
                        <Calculator className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredEntries.slice(0, 15).map((entry: FinancialEntry) => (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-lg border ${
                      entry.type === 'gain' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full ${
                          entry.type === 'gain' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {entry.type === 'gain' ? (
                            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <span className={`text-lg font-semibold ${
                            entry.type === 'gain' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {entry.type === 'gain' ? '+' : '-'}{parseFloat(entry.amount).toLocaleString('ar-DZ')} دج
                          </span>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {entry.type === 'gain' ? 'ربح' : 'خسارة'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {new Date(entry.createdAt).toLocaleDateString('ar-DZ')}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(entry.createdAt).toLocaleTimeString('ar-DZ', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 bg-white bg-opacity-50 p-2 rounded border-l-2 border-gray-300">
                      {entry.remarks}
                    </p>
                  </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}