import { useState, useRef, useCallback, useEffect } from 'react';
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
  UserCheck,
  RotateCcw,
  Search,
  Filter
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
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  
  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentMonth, setPaymentMonth] = useState(new Date().getMonth() + 1);
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());
  const [isProcessing, setIsProcessing] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEducationLevel, setSelectedEducationLevel] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);

  // Cleanup on component unmount
  useEffect(() => {
    return cleanup;
  }, []);

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

  // Search and filter functions
  const handleSearch = async () => {
    if (!searchQuery.trim() && !selectedEducationLevel && !selectedRole) {
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedEducationLevel) params.append('educationLevel', selectedEducationLevel);
      if (selectedRole) params.append('role', selectedRole);
      
      const response = await fetch(`/api/users?${params.toString()}`);

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowStudentList(true);
      } else {
        const errorData = await response.json();
        toast({
          title: "خطأ في البحث",
          description: errorData.error || "فشل في البحث عن الطلاب",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "خطأ في الشبكة",
        description: "فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStudent = async (student: any) => {
    setIsProcessing(true);
    try {
      // For users with role 'user', we need to find their children
      if (student.role === 'user') {
        // Get children for this parent
        const childrenResponse = await fetch(`/api/children?parentId=${student.id}`);
        if (childrenResponse.ok) {
          const children = await childrenResponse.json();
          if (children.length > 0) {
            // For now, select the first child - in a real implementation you'd show a selection dialog
            const child = children[0];
            const response = await fetch('/api/scan-student-qr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                studentId: child.id,
                studentType: 'child'
              })
            });
            
            if (response.ok) {
              const profileData = await response.json();
              setScannedProfile(profileData);
              setShowStudentList(false);
              toast({
                title: "تم تحميل ملف الطفل",
                description: `تم تحميل ملف ${profileData.name} بنجاح`
              });
              return;
            }
          } else {
            toast({
              title: "لا توجد أطفال",
              description: "لا يوجد أطفال مسجلين لهذا الولي",
              variant: "destructive"
            });
            return;
          }
        }
      } else {
        // Regular student selection
        const response = await fetch('/api/scan-student-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            studentId: student.id,
            studentType: 'student'
          })
        });

        if (response.ok) {
          const profileData = await response.json();
          setScannedProfile(profileData);
          setShowStudentList(false);
          toast({
            title: "تم تحميل ملف الطالب",
            description: `تم تحميل ملف ${profileData.name} بنجاح`
          });
        } else {
          const errorData = await response.json();
          toast({
            title: "خطأ في تحميل الملف",
            description: errorData.error || "فشل في تحميل ملف الطالب",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Student selection error:', error);
      toast({
        title: "خطأ في الشبكة",
        description: "فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cleanup = useCallback(() => {
    setIsScanning(false);
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (err) {
        console.log('Scanner cleanup error:', err);
      }
    }
    // Also stop all video streams
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const initializeScanner = useCallback(async () => {
    try {
      setError(null);
      setScannedProfile(null);
      setIsScanning(true);

      // Check browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('متصفحك لا يدعم استخدام الكاميرا');
        setIsScanning(false);
        return;
      }

      // Initialize code reader
      codeReaderRef.current = new BrowserQRCodeReader();

      // Get video devices
      try {
        const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
        console.log('Available cameras:', videoInputDevices);
        setDevices(videoInputDevices);

        if (videoInputDevices.length === 0) {
          setError('لم يتم العثور على كاميرا في جهازك');
          setIsScanning(false);
          return;
        }

        // Try to use the first available camera
        const deviceId = videoInputDevices[0].deviceId;
        setSelectedDeviceId(deviceId);
        await startCamera(deviceId);

      } catch (deviceErr) {
        console.error('Error listing devices:', deviceErr);
        setError('خطأ في العثور على الكاميرات المتاحة');
        setIsScanning(false);
      }

    } catch (err) {
      console.error('Error initializing scanner:', err);
      setError('خطأ في تهيئة الماسح الضوئي');
      setIsScanning(false);
    }
  }, []);

  const startCamera = useCallback(async (deviceId: string) => {
    if (!codeReaderRef.current || !videoRef.current) {
      setError('خطأ في تهيئة الكاميرا');
      setIsScanning(false);
      return;
    }

    try {
      console.log('Starting camera with device:', deviceId);
      
      const videoElement = videoRef.current;
      
      // Manually get MediaStream first
      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment' // Use back camera if available
        }
      };
      
      console.log('Getting user media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set the stream to video element
      videoElement.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        videoElement.addEventListener('loadedmetadata', resolve, { once: true });
        videoElement.addEventListener('error', reject, { once: true });
        
        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Video loading timeout')), 5000);
      });
      
      console.log('Video loaded, dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
      
      // Now start QR code scanning using ZXing on the video element
      const scanningControls = await codeReaderRef.current.decodeFromVideoElement(
        videoElement,
        (result, error) => {
          if (result) {
            console.log('🎯 QR code detected successfully:', result.getText());
            console.log('QR code format:', result.getBarcodeFormat());
            console.log('QR code raw bytes:', result.getRawBytes());
            handleQRScan(result.getText());
          }
          
          if (error) {
            // Only log non-NotFoundException errors, but still log them for debugging
            if (error.name !== 'NotFoundException') {
              console.error('❌ Decode error:', error.name, error.message);
            } else {
              // Occasionally log NotFoundException to confirm scanning is active
              if (Math.random() < 0.01) { // Log 1% of the time
                console.log('🔍 Scanning active - no QR code found in frame');
              }
            }
          }
        }
      );
      
      // Store both stream and scanning controls for cleanup
      controlsRef.current = {
        stop: () => {
          scanningControls.stop();
          stream.getTracks().forEach(track => track.stop());
          videoElement.srcObject = null;
        }
      };

      console.log('Camera and QR scanning started successfully');

    } catch (err: any) {
      console.error('Error starting camera:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('يرجى السماح بالوصول للكاميرا');
      } else if (err.name === 'NotFoundError') {
        setError('لم يتم العثور على الكاميرا المحددة');
      } else if (err.name === 'NotReadableError') {
        setError('الكاميرا مستخدمة من تطبيق آخر');
      } else if (err.message === 'Video loading timeout') {
        setError('انتهت مهلة تحميل الفيديو. جرب كاميرا أخرى');
      } else {
        setError('خطأ في تشغيل الكاميرا: ' + (err.message || 'خطأ غير معروف'));
      }
      setIsScanning(false);
    }
  }, []);

  const startScanning = useCallback(async () => {
    await initializeScanner();
  }, [initializeScanner]);

  const stopScanning = useCallback(() => {
    console.log('Stopping QR scanner...');
    cleanup();
  }, [cleanup]);

  const switchCamera = useCallback(async () => {
    if (devices.length <= 1) return;
    
    const currentIndex = devices.findIndex(device => device.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDeviceId = devices[nextIndex].deviceId;
    
    setSelectedDeviceId(nextDeviceId);
    cleanup();
    await startCamera(nextDeviceId);
  }, [devices, selectedDeviceId, cleanup, startCamera]);

  const retry = useCallback(() => {
    cleanup();
    initializeScanner();
  }, [cleanup, initializeScanner]);

  const handleQRScan = async (qrData: string) => {
    try {
      setIsProcessing(true);
      console.log('🔄 Processing QR data:', qrData);
      console.log('🔄 QR data length:', qrData.length);
      console.log('🔄 QR data first 100 chars:', qrData.substring(0, 100));
      
      const response = await fetch('/api/scan-student-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData })
      });

      console.log('📡 API response status:', response.status);
      console.log('📡 API response ok:', response.ok);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API error response:', error);
        throw new Error(error.error || 'خطأ في مسح الرمز');
      }

      const profile = await response.json();
      console.log('✅ Profile received:', profile);
      setScannedProfile(profile);
      stopScanning();
      
      toast({
        title: "تم مسح الرمز بنجاح",
        description: `تم العثور على الطالب: ${profile.name}`
      });
      
    } catch (error: any) {
      console.error('❌ QR scan error:', error);
      setError(error.message || 'خطأ في مسح الرمز');
      stopScanning();
      
      // Show error toast
      toast({
        title: "خطأ في مسح الرمز",
        description: error.message || 'خطأ في مسح الرمز',
        variant: "destructive"
      });
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
                  className="w-full max-w-md mx-auto border-2 border-green-400 rounded-lg bg-gray-900"
                  style={{ aspectRatio: '4/3', minHeight: '300px' }}
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                />
                
                {/* Scanner overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500"></div>
                  </div>
                </div>
                
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                  جاهز للمسح
                </div>
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                    <span className="text-white font-semibold">جاري معالجة الرمز...</span>
                  </div>
                )}
              </div>
              <div className="text-center mt-2 space-y-2">
                <p className="text-sm text-gray-600">
                  وجه الكاميرا نحو رمز QR الخاص بالطالب
                </p>
                
                {devices.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={switchCamera}
                    disabled={!isScanning}
                    className="text-xs"
                  >
                    <RotateCcw className="w-3 h-3 ml-1" />
                    تبديل الكاميرا ({devices.length} متاح)
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
              <div className="mt-3">
                <Button onClick={retry} size="sm" variant="outline">
                  <RotateCcw className="h-4 w-4 ml-2" />
                  إعادة المحاولة
                </Button>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Search and Filter Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              البحث عن الطلاب
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStudentList(!showStudentList)}
            >
              {showStudentList ? 'إخفاء القائمة' : 'عرض قائمة الطلاب'}
            </Button>
          </CardTitle>
          <CardDescription>
            ابحث عن الطلاب بالاسم أو الرقم أو اعرض قائمة مفلترة حسب المستوى والسنة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <Input
                placeholder="ابحث بالاسم، الرقم، أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch}
                disabled={isSearching || isProcessing}
                className="px-6"
              >
                <Search className="h-4 w-4 ml-2" />
                {isSearching ? 'بحث...' : 'بحث'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                فلترة
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2">المستوى التعليمي</Label>
                    <Select value={selectedEducationLevel} onValueChange={setSelectedEducationLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المستوى التعليمي" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع المستويات</SelectItem>
                        <SelectItem value="الابتدائي">الابتدائي</SelectItem>
                        <SelectItem value="المتوسط">المتوسط</SelectItem>
                        <SelectItem value="الثانوي">الثانوي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2">نوع المستخدم</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع المستخدم" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">الكل</SelectItem>
                        <SelectItem value="student">طلاب</SelectItem>
                        <SelectItem value="user">أولياء الأمور</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Search Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedEducationLevel('الابتدائي');
                  setSelectedRole('student');
                  handleSearch();
                }}
              >
                طلاب الابتدائي
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedEducationLevel('المتوسط');
                  setSelectedRole('student');
                  handleSearch();
                }}
              >
                طلاب المتوسط
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedEducationLevel('الثانوي');
                  setSelectedRole('student');
                  handleSearch();
                }}
              >
                طلاب الثانوي
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      {showStudentList && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              نتائج البحث ({searchResults.length} طالب)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSearching ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-gray-600">جاري البحث...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((student) => (
                  <div key={student.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student.profilePicture} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-sm">{student.name}</h3>
                          <div className="text-xs text-gray-600">#{student.id}</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant={student.role === 'student' ? 'default' : 'secondary'} className="text-xs">
                          {student.role === 'student' ? 'طالب' : 'ولي أمر'}
                        </Badge>
                        {student.verified && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <UserCheck className="h-3 w-3 ml-1" />
                            محقق
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600 mb-3">
                      {student.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{student.email}</span>
                        </div>
                      )}
                      {student.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleSelectStudent(student)}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      <User className="h-4 w-4 ml-2" />
                      عرض الملف الشخصي
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>لا توجد نتائج. جرب البحث بكلمات مختلفة أو غير الفلاتر</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                    {scannedProfile.recentAttendance?.length > 0 ? scannedProfile.recentAttendance.map((attendance) => (
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
                    )) : (
                      <div className="text-center text-gray-500 py-4">
                        لا توجد سجلات حضور حديثة
                      </div>
                    )}
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
                    {scannedProfile.recentPayments?.length > 0 ? scannedProfile.recentPayments.map((payment) => (
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
                    )) : (
                      <div className="text-center text-gray-500 py-4">
                        لا توجد سجلات دفع حديثة
                      </div>
                    )}
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