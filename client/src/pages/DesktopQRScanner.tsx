import { useState, useRef, useCallback } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import TestQRCode from '@/components/TestQRCode';
import { 
  QrCode, 
  Camera, 
  CameraOff, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Printer,
  UserCheck
} from 'lucide-react';

interface StudentProfile {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  type: 'student' | 'child';
  educationLevel?: string;
  selectedSubjects?: string[];
  profilePicture?: string;
  verified: boolean;
  parentName?: string;
  parentPhone?: string;
  attendanceStats: {
    totalClasses: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
  };
  paymentStats: {
    totalDue: number;
    paidCount: number;
    unpaidCount: number;
    totalAmount: number;
  };
  enrolledGroups: Array<{
    id: number;
    name: string;
    educationLevel: string;
    subjectName: string;
    teacherName: string;
  }>;
  recentAttendance: Array<{
    id: number;
    date: string;
    status: string;
    groupName: string;
    notes?: string;
  }>;
  recentPayments: Array<{
    id: number;
    year: number;
    month: number;
    amount?: string;
    isPaid: boolean;
    paidAt?: string;
    notes?: string;
  }>;
}

export default function DesktopQRScanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProfile, setScannedProfile] = useState<StudentProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [codeReader, setCodeReader] = useState<BrowserQRCodeReader | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentMonth, setPaymentMonth] = useState(new Date().getMonth() + 1);
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if user has permission to use desktop scanner
  if (!user || !['admin', 'teacher'].includes(user.role)) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Alert className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            غير مسموح لك باستخدام الماسح المكتبي. يجب أن تكون مدير أو معلم.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setScannedProfile(null);
      
      console.log('Starting QR scanner...');
      console.log('Video element available:', !!videoRef.current);
      
      // Check if we have camera permissions first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('Camera permission granted, available tracks:', stream.getVideoTracks().length);
        stream.getTracks().forEach(track => track.stop()); // Clean up test stream
      } catch (permError) {
        console.error('Camera permission denied:', permError);
        throw new Error('لم يتم منح إذن الوصول للكاميرا. يرجى السماح بالوصول للكاميرا وإعادة المحاولة.');
      }
      
      const reader = new BrowserQRCodeReader();
      setCodeReader(reader);
      
      // Get available video devices
      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
      console.log('Available video devices:', videoInputDevices.length, videoInputDevices);
      
      if (videoInputDevices.length === 0) {
        throw new Error('لم يتم العثور على كاميرا متاحة. تأكد من توصيل كاميرا ومنح الإذن للمتصفح.');
      }
      
      setIsScanning(true);
      
      // Start continuous scanning with video preview
      const controls = await reader.decodeFromVideoDevice(
        videoInputDevices[0].deviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            console.log('QR Code detected:', result.getText());
            handleQRScan(result.getText());
          }
          // Suppress NotFoundException - it's normal when no QR code is visible
          if (error && !error.name?.includes('NotFoundException')) {
            console.error('QR scanning error:', error);
          }
        }
      );
      
      console.log('QR scanner started successfully with controls:', !!controls);
      
      // Store controls for cleanup
      setCodeReader({ ...reader, controls } as any);
      
    } catch (err: any) {
      console.error('Scanning error:', err);
      setError(`خطأ في المسح: ${err.message || 'خطأ غير معروف'}`);
      setIsScanning(false);
    }
  }, []);

  const stopScanning = useCallback(() => {
    console.log('Stopping QR scanner...');
    
    if (codeReader) {
      // Stop the QR reader controls if they exist
      if ((codeReader as any).controls) {
        (codeReader as any).controls.stop();
      }
      
      // Stop all video tracks
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => {
            track.stop();
            console.log('Stopped video track:', track.kind);
          });
        }
        videoRef.current.srcObject = null;
      }
    }
    
    setIsScanning(false);
    setCodeReader(null);
  }, [codeReader]);

  const handleQRScan = async (qrData: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/scan-student-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطأ في مسح الرمز');
      }

      const profile = await response.json();
      setScannedProfile(profile);
      stopScanning();
      
      toast({
        title: "تم مسح الرمز بنجاح",
        description: `تم العثور على الطالب: ${profile.name}`
      });
      
    } catch (error: any) {
      console.error('QR scan error:', error);
      setError(error.message || 'خطأ في مسح الرمز');
      stopScanning();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAttendance = async (status: 'present' | 'absent' | 'late' | 'excused') => {
    if (!scannedProfile) return;

    try {
      setIsProcessing(true);
      const response = await fetch('/api/scan-student-qr/mark-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: scannedProfile.id,
          studentType: scannedProfile.type,
          status
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطأ في تسجيل الحضور');
      }

      const result = await response.json();
      toast({
        title: "تم تسجيل الحضور",
        description: result.message
      });
      
      // Refresh the profile to show updated attendance
      await handleQRScan(`${scannedProfile.type}:${scannedProfile.id}:${user?.schoolId}:verified`);
      
    } catch (error: any) {
      console.error('Attendance error:', error);
      toast({
        title: "خطأ في تسجيل الحضور",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!scannedProfile || !paymentAmount) return;

    try {
      setIsProcessing(true);
      const response = await fetch('/api/scan-student-qr/record-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: scannedProfile.id,
          studentType: scannedProfile.type,
          amount: parseFloat(paymentAmount),
          paymentMethod,
          notes: paymentNotes,
          year: paymentYear,
          month: paymentMonth
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطأ في تسجيل الدفعة');
      }

      const result = await response.json();
      toast({
        title: "تم تسجيل الدفعة",
        description: result.message
      });
      
      // Reset payment form
      setPaymentAmount('');
      setPaymentNotes('');
      
      // Refresh the profile to show updated payments
      await handleQRScan(`${scannedProfile.type}:${scannedProfile.id}:${user?.schoolId}:verified`);
      
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "خطأ في تسجيل الدفعة",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { label: 'حاضر', className: 'bg-green-100 text-green-800' },
      absent: { label: 'غائب', className: 'bg-red-100 text-red-800' },
      late: { label: 'متأخر', className: 'bg-yellow-100 text-yellow-800' },
      excused: { label: 'عذر', className: 'bg-blue-100 text-blue-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            الماسح المكتبي لرموز الطلاب
          </CardTitle>
          <CardDescription>
            قم بمسح رمز الطالب للوصول إلى ملفه الشخصي وإدارة الحضور والمدفوعات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            {!isScanning ? (
              <Button onClick={startScanning} className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                بدء المسح
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="destructive" className="flex items-center gap-2">
                <CameraOff className="h-4 w-4" />
                إيقاف المسح
              </Button>
            )}
          </div>
          
          {isScanning && (
            <div className="mb-4">
              <div className="relative">
                <video 
                  ref={videoRef} 
                  className="w-full max-w-md mx-auto border-2 border-green-400 rounded-lg"
                  style={{ aspectRatio: '4/3' }}
                  autoPlay
                  playsInline
                  muted
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                  جاهز للمسح
                </div>
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                    <span className="text-white font-semibold">جاري معالجة الرمز...</span>
                  </div>
                )}
              </div>
              <div className="text-center mt-2 text-sm text-gray-600">
                وجه الكاميرا نحو رمز QR الخاص بالطالب
              </div>
            </div>
          )}
          
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {scannedProfile && (
        <div className="grid gap-6">
          {/* Student Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={scannedProfile.profilePicture} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">{scannedProfile.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Badge variant={scannedProfile.type === 'student' ? 'default' : 'secondary'}>
                        {scannedProfile.type === 'student' ? 'طالب' : 'طفل'}
                      </Badge>
                      {scannedProfile.verified && (
                        <Badge className="bg-green-100 text-green-800">
                          <UserCheck className="h-3 w-3 ml-1" />
                          محقق
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scannedProfile.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{scannedProfile.email}</span>
                  </div>
                )}
                {scannedProfile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{scannedProfile.phone}</span>
                  </div>
                )}
                {scannedProfile.parentName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">ولي الأمر: {scannedProfile.parentName}</span>
                  </div>
                )}
                {scannedProfile.parentPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">هاتف ولي الأمر: {scannedProfile.parentPhone}</span>
                  </div>
                )}
                {scannedProfile.educationLevel && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">المستوى: {scannedProfile.educationLevel}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button 
                  onClick={() => handleMarkAttendance('present')}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 ml-2" />
                  حاضر
                </Button>
                <Button 
                  onClick={() => handleMarkAttendance('late')}
                  disabled={isProcessing}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <Clock className="h-4 w-4 ml-2" />
                  متأخر
                </Button>
                <Button 
                  onClick={() => handleMarkAttendance('absent')}
                  disabled={isProcessing}
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 ml-2" />
                  غائب
                </Button>
                <Button 
                  onClick={() => handleMarkAttendance('excused')}
                  disabled={isProcessing}
                  variant="outline"
                >
                  <AlertCircle className="h-4 w-4 ml-2" />
                  عذر
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  إحصائيات الحضور
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {scannedProfile.attendanceStats.presentCount}
                    </div>
                    <div className="text-sm text-gray-600">حاضر</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {scannedProfile.attendanceStats.absentCount}
                    </div>
                    <div className="text-sm text-gray-600">غائب</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {scannedProfile.attendanceStats.lateCount}
                    </div>
                    <div className="text-sm text-gray-600">متأخر</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {scannedProfile.attendanceStats.totalClasses}
                    </div>
                    <div className="text-sm text-gray-600">إجمالي</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  إحصائيات المدفوعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {scannedProfile.paymentStats.paidCount}
                    </div>
                    <div className="text-sm text-gray-600">مدفوع</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {scannedProfile.paymentStats.unpaidCount}
                    </div>
                    <div className="text-sm text-gray-600">غير مدفوع</div>
                  </div>
                  <div className="col-span-2 text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {scannedProfile.paymentStats.totalAmount} دج
                    </div>
                    <div className="text-sm text-gray-600">إجمالي المبلغ</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information Tabs */}
          <Tabs defaultValue="groups" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="groups">المجموعات</TabsTrigger>
              <TabsTrigger value="attendance">الحضور</TabsTrigger>
              <TabsTrigger value="payments">المدفوعات</TabsTrigger>
              {user.role === 'admin' && <TabsTrigger value="payment-form">تسجيل دفعة</TabsTrigger>}
              <TabsTrigger value="test-qr">QR للاختبار</TabsTrigger>
            </TabsList>

            <TabsContent value="groups" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    المجموعات المسجل فيها
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scannedProfile.enrolledGroups.map((group) => (
                      <div key={group.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{group.name}</h4>
                            <p className="text-sm text-gray-600">{group.subjectName}</p>
                            <p className="text-sm text-gray-500">{group.educationLevel}</p>
                          </div>
                          <div className="text-sm text-gray-500">
                            المعلم: {group.teacherName}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    سجل الحضور الأخير
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scannedProfile.recentAttendance.map((attendance) => (
                      <div key={attendance.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="font-medium">{attendance.groupName}</div>
                          <div className="text-sm text-gray-500">{attendance.date}</div>
                          {attendance.notes && (
                            <div className="text-sm text-gray-600 mt-1">{attendance.notes}</div>
                          )}
                        </div>
                        {getStatusBadge(attendance.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    سجل المدفوعات الأخير
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scannedProfile.recentPayments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="font-medium">
                            {months[payment.month - 1]} {payment.year}
                          </div>
                          {payment.amount && (
                            <div className="text-sm text-gray-600">{payment.amount} دج</div>
                          )}
                          {payment.notes && (
                            <div className="text-sm text-gray-500">{payment.notes}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge className={payment.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {payment.isPaid ? 'مدفوع' : 'غير مدفوع'}
                          </Badge>
                          {payment.paidAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(payment.paidAt).toLocaleDateString('ar-DZ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {user.role === 'admin' && (
              <TabsContent value="payment-form" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      تسجيل دفعة جديدة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">المبلغ (دج)</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="method">طريقة الدفع</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">نقدي</SelectItem>
                            <SelectItem value="bank">تحويل بنكي</SelectItem>
                            <SelectItem value="card">بطاقة</SelectItem>
                            <SelectItem value="cheque">شيك</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="month">الشهر</Label>
                        <Select value={paymentMonth.toString()} onValueChange={(value) => setPaymentMonth(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month, index) => (
                              <SelectItem key={index} value={(index + 1).toString()}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="year">السنة</Label>
                        <Input
                          id="year"
                          type="number"
                          value={paymentYear}
                          onChange={(e) => setPaymentYear(parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">ملاحظات</Label>
                      <Textarea
                        id="notes"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="ملاحظات إضافية..."
                        rows={3}
                      />
                    </div>

                    <Button 
                      onClick={handleRecordPayment}
                      disabled={!paymentAmount || isProcessing}
                      className="w-full"
                    >
                      <DollarSign className="h-4 w-4 ml-2" />
                      تسجيل الدفعة
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="test-qr" className="mt-6">
              <TestQRCode />
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Show test QR generator when no profile is scanned */}
      {!scannedProfile && (
        <div className="mt-6">
          <TestQRCode />
        </div>
      )}
    </div>
  );
}