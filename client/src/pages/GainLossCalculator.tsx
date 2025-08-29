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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center justify-center gap-3">
          <Calculator className="w-8 h-8 text-primary" />
          حاسبة الأرباح والخسائر
        </h1>
        <p className="text-gray-600 dark:text-gray-400">أداة بسيطة لتتبع الأرباح والخسائر المالية</p>
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
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">فلترة الرصيد:</span>
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
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {balanceFilter === 'all' 
              ? 'النتيجة الصافية = إجمالي الدخل - إجمالي المصروفات'
              : `النتيجة الصافية لفترة ${getBalanceFilterLabel()}`
            }
          </p>
          {balanceFilter !== 'all' && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                الرصيد الإجمالي: {currentBalance >= 0 ? '+' : ''}{currentBalance.toLocaleString('ar-DZ')} دج
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
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
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">فلترة حسب الفترة:</span>
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
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">جاري التحميل...</div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-500 dark:text-red-400 mb-2">خطأ في تحميل البيانات</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {error.message.includes('401') ? 'يرجى تسجيل الدخول مرة أخرى' : 'تحقق من الاتصال'}
                </div>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {timeFilter === 'all' ? 'لا توجد عمليات' : `لا توجد عمليات في ${getFilterLabel()}`}
              </div>
            ) : (
              <>
                {/* Show filtered balance if different from total */}
                {timeFilter !== 'all' && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">الرصيد لفترة: {getFilterLabel()}</div>
                        <div className={`text-xl font-bold ${filteredBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {filteredBalance >= 0 ? '+' : ''}{filteredBalance.toLocaleString('ar-DZ')} دج
                        </div>
                      </div>
                      <div className="text-blue-500 dark:text-blue-400">
                        <Calculator className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredEntries.slice(0, 15).map((entry: FinancialEntry) => (
                  <div
                    key={entry.id}
                    className={`p-5 rounded-xl border-2 shadow-sm hover:shadow-md transition-shadow ${
                      entry.type === 'gain' 
                        ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700' 
                        : 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700'
                    }`}
                  >
                    {/* Header with amount and date */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          entry.type === 'gain' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {entry.type === 'gain' ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <span className={`text-xl font-bold ${
                            entry.type === 'gain' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                          }`}>
                            {entry.type === 'gain' ? '+' : '-'}{parseFloat(entry.amount).toLocaleString('ar-DZ')} دج
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {entry.type === 'gain' ? 'ربح' : 'خسارة'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right bg-white dark:bg-gray-800 px-3 py-1 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                          {new Date(entry.createdAt).toLocaleDateString('ar-DZ')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(entry.createdAt).toLocaleTimeString('ar-DZ', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      {(() => {
                        // Parse refund format: "استرداد دفعة - الطالب: NAME - المجموعة: GROUP - الشهر المستردة: MONTH/YEAR - السبب: REASON"
                        const refundMatch = entry.remarks.match(/استرداد دفعة - الطالب: ([^-]+) - المجموعة: ([^-]+) - الشهر المستردة: ([^-]+) - السبب: (.+)/);
                        
                        if (refundMatch) {
                          const [, studentName, groupName, refundedMonth, refundReason] = refundMatch;
                          return (
                            <div className="space-y-4 border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-r-lg">
                              {/* Refund Header */}
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                <span className="font-bold text-orange-800 dark:text-orange-300 text-lg">
                                  استرداد دفعة
                                </span>
                              </div>
                              
                              {/* Student Name */}
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                  الطالب: {studentName.trim()}
                                </span>
                              </div>
                              
                              {/* Group Name */}
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span className="text-gray-700 dark:text-gray-300">
                                  المجموعة: {groupName.trim()}
                                </span>
                              </div>
                              
                              {/* Refunded Month */}
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-gray-700 dark:text-gray-300">
                                  الشهر المستردة: {(() => {
                                    const monthYearParts = refundedMonth.trim().split('/');
                                    if (monthYearParts.length === 2) {
                                      const month = parseInt(monthYearParts[0]);
                                      const year = monthYearParts[1];
                                      const arabicMonths = [
                                        '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                                        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
                                      ];
                                      return `${arabicMonths[month]} ${year}`;
                                    }
                                    return refundedMonth.trim();
                                  })()}
                                </span>
                              </div>
                              
                              {/* Refund Reason */}
                              <div className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                                <span className="text-gray-700 dark:text-gray-300 italic">
                                  سبب الاسترداد: {refundReason.trim()}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        
                        // Parse payment receipt format: "إيصال دفع رقم: REC-XXX - الطالب: NAME - DETAILS"
                        const receiptMatch = entry.remarks.match(/إيصال دفع رقم: ([^-]+) - الطالب: ([^-]+) - (.+)/);
                        
                        if (receiptMatch) {
                          const [, receiptId, studentName, paymentDetails] = receiptMatch;
                          return (
                            <div className="space-y-4">
                              {/* Student Name */}
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
                                  {studentName.trim()}
                                </span>
                              </div>
                              
                              {/* Receipt ID */}
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-mono">
                                  إيصال: {receiptId.trim()}
                                </span>
                              </div>
                              
                              {/* Payment Details - Each subject on separate line */}
                              <div className="space-y-2">
                                {(() => {
                                  // Parse payment details format: "Subject1 Group1 (months) - Subject2 Group2 (months)"
                                  const subjects = paymentDetails.trim().split(' - ');
                                  
                                  return subjects.map((subject, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {subject.trim()}
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          );
                        }
                        
                        // Fallback for other entry types - also try to parse and format
                        // Handle the case where the text might be formatted differently
                        const parts = entry.remarks.split(' - ');
                        if (parts.length >= 3) {
                          // Try to extract parts manually
                          const receiptPart = parts[0]; // "إيصال دفع رقم: REC-XXX"
                          const studentPart = parts[1]; // "الطالب: NAME"
                          const paymentPart = parts.slice(2).join(' - '); // Everything else
                          
                          const receiptId = receiptPart.replace('إيصال دفع رقم: ', '').trim();
                          const studentName = studentPart.replace('الطالب: ', '').trim();
                          
                          return (
                            <div className="space-y-4">
                              {/* Student Name */}
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
                                  {studentName}
                                </span>
                              </div>
                              
                              {/* Receipt ID */}
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-mono">
                                  إيصال: {receiptId}
                                </span>
                              </div>
                              
                              {/* Payment Details - Each subject on separate line */}
                              <div className="space-y-2">
                                {(() => {
                                  // Split by " - " to separate different subjects
                                  const subjects = paymentPart.trim().split(' - ');
                                  
                                  return subjects.map((subject, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {subject.trim()}
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          );
                        }
                        
                        // Final fallback for completely different format
                        return (
                          <div className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {entry.remarks}
                          </div>
                        );
                      })()}
                    </div>
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