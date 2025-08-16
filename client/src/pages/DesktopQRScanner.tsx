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
import { useQueryClient } from '@tanstack/react-query';
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
  Filter,
  CreditCard,
  ChevronLeft,
  ChevronRight
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

// Component to show attendance table for a specific group
function GroupAttendanceTable({ 
  groupId, 
  studentId, 
  studentType, 
  studentName,
  refreshTrigger,
  groupPaymentStatus
}: { 
  groupId: number;
  studentId: number;
  studentType: 'student' | 'child';
  studentName: string;
  refreshTrigger?: number; // Add optional refresh trigger prop
  groupPaymentStatus: {[groupId: number]: {[month: number]: boolean}}; // Payment status shared from parent
}) {
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  // Remove unused paymentStatus state since we're using shared groupPaymentStatus
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  // Removed paymentStatusByMonth - now using shared groupPaymentStatus from parent

  // Group dates by month similar to Groups page
  const monthGroups = scheduledDates.reduce((acc: { [key: string]: string[] }, date: string) => {
    const monthKey = date.substring(0, 7); // YYYY-MM format
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(date);
    return acc;
  }, {});

  const monthKeys = Object.keys(monthGroups).sort().reverse();
  
  // Initialize to current month if available, otherwise start from first month
  useEffect(() => {
    if (monthKeys.length > 0) {
      const currentDate = new Date();
      const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const currentMonthIdx = monthKeys.indexOf(currentMonthKey);
      if (currentMonthIdx >= 0) {
        setCurrentMonthIndex(currentMonthIdx);
      } else {
        setCurrentMonthIndex(0); // Default to first available month
      }
    }
  }, [monthKeys.length]);

  const currentMonthKey = monthKeys[currentMonthIndex];
  const currentMonthDates = currentMonthKey ? monthGroups[currentMonthKey].sort() : [];

  const getMonthDisplayName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const goToPreviousMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonthIndex < monthKeys.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  // Critical Fix: We need to fetch payment status and sync with parent component
  // This was accidentally removed, causing all payments to show as unpaid

  // Fetch all group data once and on refresh trigger
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch scheduled dates for the group
        const scheduledResponse = await fetch(`/api/groups/${groupId}/scheduled-dates`);
        let dates: string[] = [];
        if (scheduledResponse.ok) {
          const scheduledData = await scheduledResponse.json();
          dates = scheduledData.dates || [];
          setScheduledDates(dates);
        }

        // Fetch attendance history for the group
        const attendanceResponse = await fetch(`/api/groups/${groupId}/attendance-history`);
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          // Filter for this specific student
          const studentAttendance = attendanceData.filter((record: any) => 
            record.studentId === studentId && record.studentType === studentType
          );
          setAttendanceHistory(studentAttendance);
        }

        // Only fetch payment data if we have dates
        if (dates.length > 0) {
          // Create month groups from dates
          const monthGroups = dates.reduce((acc: { [key: string]: string[] }, date: string) => {
            const monthKey = date.substring(0, 7); // YYYY-MM format
            if (!acc[monthKey]) acc[monthKey] = [];
            acc[monthKey].push(date);
            return acc;
          }, {});

          // Fetch payment status for all months that have scheduled dates
          const paymentPromises = Object.keys(monthGroups).map(async (monthKey) => {
            const [year, month] = monthKey.split('-');
            const response = await fetch(`/api/groups/${groupId}/payment-status/${year}/${month}`);
            if (response.ok) {
              const paymentData = await response.json();
              const studentPayment = paymentData.find((record: any) => 
                record.studentId === studentId && record.studentType === studentType
              );
              return { monthKey, payment: studentPayment };
            }
            return { monthKey, payment: null };
          });
          
          const paymentResults = await Promise.all(paymentPromises);
          const paymentsByMonth: {[key: string]: any} = {};
          paymentResults.forEach(result => {
            paymentsByMonth[result.monthKey] = result.payment;
          });
          // CRITICAL: Update the shared parent payment status with fetched data
          console.log(`🔄 Updating parent payment status for group ${groupId}:`, paymentsByMonth);
          
          // Convert from monthKey format (YYYY-MM) to month number format for parent component
          const parentPaymentData: {[month: number]: boolean} = {};
          Object.entries(paymentsByMonth).forEach(([monthKey, paymentData]) => {
            const month = parseInt(monthKey.split('-')[1]); // Extract month number
            parentPaymentData[month] = paymentData?.isPaid || false;
            console.log(`💰 Group ${groupId} Month ${month}: ${paymentData?.isPaid ? 'PAID' : 'NOT PAID'}`);
          });
          
          // Update parent component's groupPaymentStatus via a callback mechanism
          // Since we can't directly call parent setter, we'll create a custom event
          window.dispatchEvent(new CustomEvent('updateGroupPaymentStatus', {
            detail: { groupId, paymentData: parentPaymentData }
          }));
        }
      } catch (error) {
        console.error('Error fetching group data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, studentId, studentType, refreshTrigger]); // Add refreshTrigger to dependency array

  // Removed payment status update effect - now using shared groupPaymentStatus

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">جاري تحميل بيانات الحضور...</p>
      </div>
    );
  }

  if (scheduledDates.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">لا توجد مواعيد مجدولة لهذه المجموعة</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-800">جدول الحضور الشهري - المواعيد المجدولة</h4>
        
        {monthKeys.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              disabled={currentMonthIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium px-3 py-1 bg-blue-50 rounded-lg text-blue-700">
                {currentMonthKey ? getMonthDisplayName(currentMonthKey) : ''}
              </div>
              <div className="text-xs text-gray-500">
                {currentMonthIndex + 1} / {monthKeys.length}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              disabled={currentMonthIndex === monthKeys.length - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {monthKeys.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300" dir="rtl">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-right font-medium">اسم الطالب</th>
                <th className="border border-gray-300 p-2 text-center font-medium min-w-[80px]">حالة الدفع</th>
                {currentMonthDates.map((date) => (
                  <th key={date} className="border border-gray-300 p-2 text-center font-medium min-w-[80px]">
                    <div className="text-xs">
                      {new Date(date).toLocaleDateString('en-US', { 
                        day: 'numeric', 
                        month: 'numeric'
                      })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 p-3 font-medium">
                  <div className="font-medium">{studentName}</div>
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    {(() => {
                      // Extract month number from currentMonthKey (YYYY-MM format)
                      const currentMonth = parseInt(currentMonthKey.split('-')[1]);
                      const currentYear = parseInt(currentMonthKey.split('-')[0]);
                      
                      // Check payment status using the same format as payment section
                      const isMonthPaid = groupPaymentStatus[groupId]?.[currentMonth] || false;
                      
                      console.log(`🔍 Attendance table month check: Group ${groupId}, Month ${currentMonth}, Paid: ${isMonthPaid}`);
                      
                      return (
                        <>
                          <span className={`px-3 py-1 rounded text-sm font-medium ${
                            isMonthPaid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {isMonthPaid ? '✅' : '❌'}
                          </span>
                          <span className="text-xs text-gray-600">
                            {isMonthPaid ? 'مدفوع' : 'غير مدفوع'}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </td>
                {currentMonthDates.map((date) => {
                  const attendanceRecord = attendanceHistory.find((record: any) => 
                    record.attendanceDate?.split('T')[0] === date
                  );
                  
                  return (
                    <td key={date} className="border border-gray-300 p-1 text-center">
                      <div className={`w-8 h-8 rounded text-xs font-bold mx-auto flex items-center justify-center ${
                        attendanceRecord?.status === 'present' 
                          ? 'bg-green-500 text-white' 
                          : attendanceRecord?.status === 'absent'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {attendanceRecord?.status === 'present' ? '✓' : 
                         attendanceRecord?.status === 'absent' ? '✗' : '?'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>

          {/* Monthly Statistics */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-100 rounded-lg p-3 text-center">
              <h5 className="font-medium text-green-800">حضور الشهر</h5>
              <p className="text-xl font-bold text-green-900">
                {attendanceHistory.filter(r => 
                  r.status === 'present' && currentMonthDates.includes(r.attendanceDate?.split('T')[0])
                ).length}
              </p>
            </div>
            <div className="bg-red-100 rounded-lg p-3 text-center">
              <h5 className="font-medium text-red-800">غياب الشهر</h5>
              <p className="text-xl font-bold text-red-900">
                {attendanceHistory.filter(r => 
                  r.status === 'absent' && currentMonthDates.includes(r.attendanceDate?.split('T')[0])
                ).length}
              </p>
            </div>
            <div className="bg-blue-100 rounded-lg p-3 text-center">
              <h5 className="font-medium text-blue-800">نسبة حضور الشهر</h5>
              <p className="text-xl font-bold text-blue-900">
                {(() => {
                  const monthRecords = attendanceHistory.filter(r => 
                    currentMonthDates.includes(r.attendanceDate?.split('T')[0])
                  );
                  const presentCount = monthRecords.filter(r => r.status === 'present').length;
                  return monthRecords.length > 0 ? Math.round((presentCount / monthRecords.length) * 100) : 0;
                })()}%
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">لا توجد مواعيد مجدولة متاحة</p>
        </div>
      )}
    </div>
  );
}

const months = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export default function DesktopQRScanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProfile, setScannedProfile] = useState<StudentProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  
  // Enhanced payment form state for ticket printer
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Group-based payment state
  const [selectedGroups, setSelectedGroups] = useState<{[key: number]: {months: number[], groupName: string, subjectName: string}}>({});
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Unified payment status for all groups and months
  const [groupPaymentStatus, setGroupPaymentStatus] = useState<{[groupId: number]: {[month: number]: boolean}}>({});
  
  // Ticket state
  const [generatedTicket, setGeneratedTicket] = useState<any>(null);
  const [showTicket, setShowTicket] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEducationLevel, setSelectedEducationLevel] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);

  // Refresh trigger for attendance tables
  const [attendanceRefreshTrigger, setAttendanceRefreshTrigger] = useState(0);

  // Define cleanup function first
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

  // Event listener to handle payment status updates from child components
  useEffect(() => {
    const handlePaymentStatusUpdate = (event: CustomEvent) => {
      const { groupId, paymentData } = event.detail;
      console.log(`🎯 Received payment status update for group ${groupId}:`, paymentData);
      
      setGroupPaymentStatus(prev => ({
        ...prev,
        [groupId]: {
          ...prev[groupId],
          ...paymentData
        }
      }));
    };

    window.addEventListener('updateGroupPaymentStatus', handlePaymentStatusUpdate as EventListener);
    
    return () => {
      window.removeEventListener('updateGroupPaymentStatus', handlePaymentStatusUpdate as EventListener);
    };
  }, []); // Remove cleanup dependency since it's not needed here

  // Separate cleanup effect on component unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

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
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedEducationLevel) params.append('educationLevel', selectedEducationLevel);
      if (selectedRole) params.append('role', selectedRole);
      
      // Use new QR scanner endpoint that searches both students and children
      const response = await fetch(`/api/qr-scanner/search?${params.toString()}`);

      if (response.ok) {
        const results = await response.json();
        // The results already include both students and children
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

  // Load all students on component mount
  useEffect(() => {
    if (user && ['admin', 'teacher'].includes(user.role)) {
      handleSearch();
    }
  }, [user]);

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
                qrData: `child:${child.id}:${user?.schoolId}:verified`
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
            qrData: `student:${student.id}:${user?.schoolId}:verified`
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
      console.log('✅ Profile enrolled groups:', profile.enrolledGroups);
      
      // Fetch payment data for each group if groups exist
      if (profile.enrolledGroups && profile.enrolledGroups.length > 0) {
        const groupsWithPayments = await Promise.all(
          profile.enrolledGroups.map(async (group: any) => {
            try {
              const paymentResponse = await fetch('/api/scan-student-qr/get-payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  studentId: profile.id,
                  studentType: profile.type,
                  groupId: group.id,
                  year: 2025 // Current year
                })
              });
              
              if (paymentResponse.ok) {
                const paymentData = await paymentResponse.json();
                return {
                  ...group,
                  paidMonths: paymentData.paidMonths || []
                };
              }
            } catch (error) {
              console.error('Error fetching payments for group', group.id, error);
            }
            
            return {
              ...group,
              paidMonths: []
            };
          })
        );
        
        profile.enrolledGroups = groupsWithPayments;
        setAvailableGroups(groupsWithPayments);
      }
      
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
          paymentMethod: 'cash',
          notes: paymentNotes,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1
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

  // Fetch student's enrolled groups when profile is loaded
  useEffect(() => {
    if (scannedProfile && scannedProfile.id) {
      fetchStudentGroups();
    }
  }, [scannedProfile]);

  const fetchStudentGroups = async () => {
    if (!scannedProfile) return;
    
    setLoadingGroups(true);
    try {
      console.log('🔄 Fetching groups and payments for student:', scannedProfile.id, 'type:', scannedProfile.type);
      
      // First fetch groups
      const groupsResponse = await fetch(`/api/students/${scannedProfile.id}/groups?type=${scannedProfile.type}`);
      console.log('🔄 Groups API response status:', groupsResponse.status);
      
      let groups = [];
      if (groupsResponse.ok) {
        groups = await groupsResponse.json();
        console.log('✅ Fetched student groups from API:', groups);
      } else {
        // Use enrolled groups from profile as fallback
        if (scannedProfile.enrolledGroups && scannedProfile.enrolledGroups.length > 0) {
          console.log('🔄 Using enrolled groups from profile:', scannedProfile.enrolledGroups);
          groups = scannedProfile.enrolledGroups;
        } else {
          console.log('⚠️ No groups available');
          setAvailableGroups([]);
          return;
        }
      }

      // Now fetch comprehensive payment data for each group using unified API approach
      const unifiedPaymentStatus: {[groupId: number]: {[month: number]: boolean}} = {};
      const groupsWithPayments = await Promise.all(
        groups.map(async (group: any) => {
          try {
            console.log(`🔄 Fetching unified payment status for group ${group.id}`);
            
            // Use the same API that attendance table uses for consistency
            const currentYear = new Date().getFullYear();
            const paymentPromises = [];
            
            // Check payment status for all 12 months using the same API as attendance table
            for (let month = 1; month <= 12; month++) {
              const promise = fetch(`/api/groups/${group.id}/payment-status/${currentYear}/${month}`)
                .then(response => response.ok ? response.json() : [])
                .then(paymentData => {
                  const studentPayment = paymentData.find((record: any) => 
                    record.studentId === scannedProfile.id && record.studentType === scannedProfile.type
                  );
                  return { month, isPaid: studentPayment?.isPaid || false };
                })
                .catch(() => ({ month, isPaid: false }));
              
              paymentPromises.push(promise);
            }

            const paymentResults = await Promise.all(paymentPromises);
            
            // Build payment status map for this group
            const groupPaymentMap: {[month: number]: boolean} = {};
            const paidMonths: number[] = [];
            
            paymentResults.forEach(result => {
              groupPaymentMap[result.month] = result.isPaid;
              if (result.isPaid) {
                paidMonths.push(result.month);
              }
            });

            unifiedPaymentStatus[group.id] = groupPaymentMap;
            
            console.log(`✅ Group ${group.id} unified payment status:`, groupPaymentMap);
            console.log(`✅ Paid months for group ${group.id}:`, paidMonths);

            return {
              ...group,
              paidMonths
            };
          } catch (error) {
            console.error(`❌ Error fetching unified payments for group ${group.id}:`, error);
            unifiedPaymentStatus[group.id] = {};
            return {
              ...group,
              paidMonths: []
            };
          }
        })
      );
      
      // Update both states: availableGroups for the payment form and unified status for sync
      setAvailableGroups(groupsWithPayments);
      setGroupPaymentStatus(unifiedPaymentStatus);
      
      console.log('✅ Final groups with unified payment data:', groupsWithPayments);
      console.log('✅ Unified payment status map:', unifiedPaymentStatus);
      
    } catch (error) {
      console.error('❌ Error fetching groups:', error);
      // Fallback to enrolled groups from the profile
      if (scannedProfile.enrolledGroups && scannedProfile.enrolledGroups.length > 0) {
        console.log('🔄 Fallback to enrolled groups:', scannedProfile.enrolledGroups);
        const groupsWithEmptyPayments = scannedProfile.enrolledGroups.map(group => ({
          ...group,
          paidMonths: []
        }));
        setAvailableGroups(groupsWithEmptyPayments);
      } else {
        console.log('⚠️ No enrolled groups available as fallback');
        setAvailableGroups([]);
      }
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleGroupSelection = (groupId: number, selected: boolean) => {
    if (selected) {
      const group = availableGroups.find(g => g.id === groupId);
      if (group) {
        setSelectedGroups(prev => ({
          ...prev,
          [groupId]: {
            months: [],
            groupName: group.name,
            subjectName: group.subjectName || group.nameAr
          }
        }));
      }
    } else {
      setSelectedGroups(prev => {
        const newState = { ...prev };
        delete newState[groupId];
        return newState;
      });
    }
  };

  const handleMonthToggle = (groupId: number, month: number) => {
    setSelectedGroups(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        months: prev[groupId].months.includes(month)
          ? prev[groupId].months.filter(m => m !== month)
          : [...prev[groupId].months, month]
      }
    }));
  };

  const createTestStudent = async () => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/debug/create-test-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "تم إنشاء الطالب التجريبي",
          description: result.message
        });
        
        // Refresh the current profile if it's student ID 1
        if (scannedProfile && scannedProfile.id === 1) {
          fetchStudentGroups();
        }
      } else {
        const error = await response.json();
        toast({
          title: "فشل في الإنشاء",
          description: error.error,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error creating test student:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إنشاء الطالب التجريبي",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePaymentTicket = async () => {
    console.log('=== PAYMENT TICKET GENERATION START ===');
    console.log('Scanned Profile:', scannedProfile);
    console.log('Payment Amount:', paymentAmount);
    console.log('Selected Groups:', selectedGroups);
    console.log('User Role:', user?.role);
    
    if (!scannedProfile || !paymentAmount || Object.keys(selectedGroups).length === 0) {
      console.log('❌ Validation failed: Missing basic requirements');
      toast({
        title: "معلومات ناقصة",
        description: "يرجى تحديد المجموعات والأشهر والمبلغ",
        variant: "destructive"
      });
      return;
    }

    // Validate that at least one month is selected
    const hasSelectedMonths = Object.values(selectedGroups).some(group => group.months.length > 0);
    console.log('Has selected months:', hasSelectedMonths);
    
    if (!hasSelectedMonths) {
      console.log('❌ Validation failed: No months selected');
      toast({
        title: "معلومات ناقصة", 
        description: "يرجى تحديد الأشهر المراد دفعها",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Create transactions for each selected group/month combination
      const transactions = [];
      for (const [groupId, groupData] of Object.entries(selectedGroups)) {
        for (const month of groupData.months) {
          const transaction = {
            studentId: scannedProfile.id,
            studentType: scannedProfile.type,
            groupId: parseInt(groupId),
            amount: Math.round((parseFloat(paymentAmount) / getTotalSelectedMonths()) * 100), // Convert to cents and distribute
            paymentMethod: 'cash', // Always cash
            notes: paymentNotes,
            month,
            year: new Date().getFullYear()
          };
          transactions.push(transaction);
        }
      }

      console.log('Creating payment records and receipt:', transactions);
      
      // 🆕 SAVE PAYMENTS TO DATABASE
      let result = { receiptId: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}` };
      
      try {
        console.log('🔄 Attempting to save payment records to database...');
        const paymentResponse = await fetch('/api/scan-student-qr/create-ticket-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            transactions,
            totalAmount: parseFloat(paymentAmount),
            receiptId: result.receiptId,
            studentName: scannedProfile.name
          })
        });

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          console.log('✅ Payment records saved successfully:', paymentData);
          result = paymentData;
        } else {
          const errorText = await paymentResponse.text();
          console.log('⚠️ Database payment save failed, using local receipt:', errorText);
          // Continue with local receipt even if database save fails
        }
      } catch (dbError) {
        console.error('⚠️ Database error, using local receipt:', dbError);
        // Continue with local receipt even if database connection fails
      }

      // Generate ticket data
      const ticket = {
        receiptId: result.receiptId || `REC-${Date.now()}`,
        studentName: scannedProfile.name,
        paymentDate: new Date().toLocaleDateString('ar-SA'),
        amount: parseFloat(paymentAmount),
        groups: Object.entries(selectedGroups).map(([groupId, groupData]) => ({
          groupName: groupData.groupName,
          subjectName: groupData.subjectName,
          months: groupData.months.map(m => getMonthName(m))
        }))
      };

      // 🆕 AUTOMATIC GAIN ENTRY: Add receipt amount to financial gains
      try {
        console.log('🔄 Creating automatic gain entry for receipt:', ticket.receiptId);
        
        const currentDate = new Date();
        const gainResponse = await fetch('/api/gain-loss-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: 'gain',
            amount: paymentAmount.trim(),
            remarks: `إيصال دفع رقم: ${ticket.receiptId} - الطالب: ${scannedProfile.name}`,
            year: currentDate.getFullYear(),
            month: currentDate.getMonth() + 1
          })
        });

        if (gainResponse.ok) {
          console.log('✅ Automatic gain entry created successfully');
          // Invalidate gain-loss cache to refresh the data
          queryClient.invalidateQueries({ queryKey: ['/api', 'gain-loss-entries'] });
          toast({
            title: "تم إنشاء إيصال الدفع بنجاح",
            description: `إيصال رقم: ${ticket.receiptId} - تم إضافة المبلغ للأرباح تلقائياً`
          });
        } else {
          const errorData = await gainResponse.json().catch(() => ({}));
          console.error('❌ Failed to create automatic gain entry. Status:', gainResponse.status, 'Error:', errorData);
          
          // Show different messages based on error type
          if (gainResponse.status === 401 || gainResponse.status === 403) {
            toast({
              title: "تم إنشاء إيصال الدفع بنجاح",
              description: `إيصال رقم: ${ticket.receiptId} - لإضافة المبلغ للأرباح، افتح حاسبة الأرباح والخسائر وأضف المبلغ يدوياً`
            });
          } else {
            toast({
              title: "تم إنشاء إيصال الدفع بنجاح",
              description: `إيصال رقم: ${ticket.receiptId} - تعذر إضافة المبلغ للأرباح تلقائياً: ${errorData.error || 'خطأ غير معروف'}`
            });
          }
        }
      } catch (gainError) {
        console.error('❌ Error creating automatic gain entry:', gainError);
        toast({
          title: "تم إنشاء إيصال الدفع بنجاح",
          description: `إيصال رقم: ${ticket.receiptId} - لإضافة المبلغ للأرباح، افتح حاسبة الأرباح والخسائر`
        });
      }

      setGeneratedTicket(ticket);
      setShowTicket(true);

      // 🔄 REFRESH PAID MONTHS DATA: Re-fetch student's payment data to update the payment form
      console.log('🔄 Refreshing student payment data after successful payment...');
      try {
        // Force refresh the payment status by clearing the cache first
        console.log('🔄 Clearing payment cache and refreshing data...');
        setGroupPaymentStatus({});
        setAvailableGroups([]);
        
        // Wait for database to propagate changes
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Refresh the student groups which will fetch latest payment data
        await fetchStudentGroups();
        setAttendanceRefreshTrigger(prev => prev + 1);
        
        // Immediately update local state with the new payment information
        const paymentDetails = Object.entries(selectedGroups);
        for (const [groupIdStr, groupData] of paymentDetails) {
          const groupId = parseInt(groupIdStr);
          const updatedGroupPaymentStatus: {[month: number]: boolean} = {};
          
          // Mark all the paid months as true in local state
          for (const month of groupData.months) {
            updatedGroupPaymentStatus[month] = true;
            console.log(`✅ Marking group ${groupId} month ${month} as PAID in local state`);
          }
          
          setGroupPaymentStatus(prev => ({
            ...prev,
            [groupId]: {
              ...prev[groupId],
              ...updatedGroupPaymentStatus
            }
          }));
        }
        
        // Wait 2 seconds to ensure database operations are complete, then refresh payment status
        console.log('💾 Waiting for database operations to complete...');
        setTimeout(async () => {
          console.log('🔄 Database operations should be complete, refreshing payment status...');
          
          // Update shared groupPaymentStatus by fetching fresh data from database
          const paymentUpdates: {[groupId: number]: {[month: number]: boolean}} = {};
          
          for (const [groupIdStr, groupData] of Object.entries(selectedGroups)) {
            const groupId = parseInt(groupIdStr);
            paymentUpdates[groupId] = {};
            
            for (const month of groupData.months) {
              try {
                const currentYear = new Date().getFullYear();
                const response = await fetch(`/api/groups/${groupId}/payment-status/${currentYear}/${month}`);
                if (response.ok) {
                  const paymentData = await response.json();
                  const studentPayment = paymentData.find((record: any) => 
                    record.studentId === scannedProfile.id && record.studentType === scannedProfile.type
                  );
                  paymentUpdates[groupId][month] = studentPayment?.isPaid || false;
                  console.log(`🔍 Database check - Group ${groupId} Month ${month}: ${studentPayment?.isPaid ? 'PAID' : 'NOT PAID'}`);
                }
              } catch (error) {
                console.error(`Error fetching payment status for Group ${groupId} Month ${month}:`, error);
                paymentUpdates[groupId][month] = false;
              }
            }
          }
          
          // Update shared state with fresh database data
          setGroupPaymentStatus(prev => ({
            ...prev,
            ...paymentUpdates
          }));
          
          // Trigger attendance table refresh
          setAttendanceRefreshTrigger(prev => {
            const newTrigger = prev + 1000; // Large increment to ensure refresh
            console.log(`🔄 Attendance refresh trigger updated with DB data: ${prev} -> ${newTrigger}`);
            return newTrigger;
          });
          
          console.log('✅ Payment status refresh complete with database verification');
        }, 2000); // 2-second delay to ensure database consistency
        
        // Additional verification: Double-check payment status via API after local update
        setTimeout(async () => {
          console.log('🔍 Final verification: checking payment status after 1 second...');
          for (const [groupIdStr, groupData] of paymentDetails) {
            const groupId = parseInt(groupIdStr);
            for (const month of groupData.months) {
              try {
                const verifyResponse = await fetch(`/api/groups/${groupId}/payment-status/2025/${month}`);
                if (verifyResponse.ok) {
                  const verifyData = await verifyResponse.json();
                  const studentVerify = verifyData.find((record: any) => 
                    record.studentId === scannedProfile.id && record.studentType === scannedProfile.type
                  );
                  console.log(`🎯 Final check - Group ${groupId} Month ${month}:`, 
                    studentVerify?.isPaid ? 'PAID ✅' : 'NOT PAID ❌'
                  );
                }
              } catch (verifyError) {
                console.error(`❌ Final verification failed for group ${groupId} month ${month}:`, verifyError);
              }
            }
          }
        }, 1000);
        
        console.log('✅ Student payment data refreshed and local state updated');
        
      } catch (refreshError) {
        console.error('⚠️ Error refreshing student payment data:', refreshError);
        // Still proceed even if refresh fails - user can manually refresh
      }

      // Reset form
      setPaymentAmount('');
      setPaymentNotes('');
      setSelectedGroups({});

    } catch (error: any) {
      console.error('Ticket generation error:', error);
      toast({
        title: "خطأ في إنشاء الإيصال",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getTotalSelectedMonths = () => {
    return Object.values(selectedGroups).reduce((total, group) => total + group.months.length, 0);
  };

  const getMonthName = (monthNum: number) => {
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return monthNames[monthNum - 1] || `الشهر ${monthNum}`;
  };

  const getPaymentMethodText = (method: string) => {
    const methods = {
      'cash': 'نقدي',
      'bank': 'تحويل بنكي', 
      'card': 'بطاقة',
      'cheque': 'شيك'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const printTicket = () => {
    if (!generatedTicket) return;
    
    // Create receipt HTML content
    const receiptHTML = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>إيصال دفع - ${generatedTicket.receiptId}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Noto Sans Arabic', Arial, sans-serif;
          background: white;
          color: #333;
          line-height: 1.6;
          direction: rtl;
          text-align: right;
        }
        .receipt-container {
          max-width: 400px;
          margin: 20px auto;
          padding: 20px;
          border: 2px solid #ddd;
          border-radius: 8px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #eee;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #333;
        }
        .school-name {
          font-size: 18px;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 8px;
        }
        .receipt-id {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
        .section {
          margin-bottom: 15px;
        }
        .section-title {
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .info-box {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 8px;
        }
        .group-item {
          background: #eff6ff;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 8px;
          border-left: 3px solid #2563eb;
        }
        .group-name {
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 2px;
        }
        .subject-name {
          font-size: 12px;
          color: #2563eb;
          margin-bottom: 4px;
        }
        .months {
          font-size: 12px;
          color: #666;
        }
        .summary {
          border-top: 2px solid #eee;
          padding-top: 15px;
          margin-top: 15px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .total-amount {
          font-size: 20px;
          font-weight: bold;
          color: #16a34a;
        }
        .payment-method {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          color: #999;
          border-top: 1px solid #eee;
          padding-top: 10px;
          margin-top: 15px;
        }
        @media print {
          body { margin: 0; }
          .receipt-container { 
            max-width: 100%; 
            margin: 0; 
            border: none; 
            box-shadow: none; 
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="title">إيصال دفع</div>
          <div class="school-name">مؤسسة تعليمية</div>
          <div class="receipt-id">رقم الإيصال: ${generatedTicket.receiptId}</div>
          <div class="receipt-id">تاريخ الدفع: ${generatedTicket.paymentDate}</div>
        </div>

        <div class="section">
          <div class="section-title">معلومات الطالب:</div>
          <div class="info-box">
            الاسم: ${generatedTicket.studentName}
          </div>
        </div>

        <div class="section">
          <div class="section-title">تفاصيل الدفع:</div>
          ${generatedTicket.groups.map(group => `
            <div class="group-item">
              <div class="group-name">${group.groupName}</div>
              <div class="subject-name">${group.subjectName}</div>
              <div class="months">الأشهر المدفوعة: ${group.months.join(', ')}</div>
            </div>
          `).join('')}
        </div>

        <div class="summary">
          <div class="total-row">
            <span>المبلغ الإجمالي:</span>
            <span class="total-amount">${generatedTicket.amount.toFixed(2)} دج</span>
          </div>
          <div class="payment-method">
            <span>طريقة الدفع:</span>
            <span>نقدي</span>
          </div>
        </div>

        <div class="footer">
          شكراً لكم على دفع الرسوم في الوقت المحدد
        </div>
      </div>
    </body>
    </html>`;

    // Open in new window for printing
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        
        // Optional: close window after printing (uncomment if desired)
        // printWindow.onafterprint = () => printWindow.close();
      };
    }
  };

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
                        <SelectItem value="student">طلاب مسجلين</SelectItem>
                        <SelectItem value="child">أطفال</SelectItem>
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
                  setSelectedRole('');
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
                  setSelectedRole('');
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
                  setSelectedRole('');
                  handleSearch();
                }}
              >
                طلاب الثانوي
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedEducationLevel('');
                  setSelectedRole('child');
                  handleSearch();
                }}
              >
                جميع الأطفال
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
                <p className="text-gray-600">جاري البحث...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((student) => (
                  <div key={student.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{student.name}</h3>
                          <div className="text-sm text-gray-600">#{student.id}</div>
                          {student.email && (
                            <div className="text-xs text-gray-500">{student.email}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={student.type === 'student' ? 'default' : 'secondary'}>
                          {student.type === 'student' ? 'طالب مسجل' : 'طفل'}
                        </Badge>
                        {student.verified && (
                          <Badge className="bg-green-100 text-green-800">
                            محقق
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleSelectStudent(student)}
                          disabled={isProcessing}
                          className="ml-2"
                        >
                          اختيار
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
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

          {/* Assigned Groups with Attendance/Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                المجموعات المسجل فيها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {scannedProfile.enrolledGroups?.length > 0 ? (
                  scannedProfile.enrolledGroups.map((group) => (
                    <div key={group.id} className="bg-white rounded-lg border">
                      {/* Group Header */}
                      <div className="p-4 border-b bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-lg">{group.name}</h4>
                            <p className="text-sm text-gray-600">{group.subjectName}</p>
                            <p className="text-sm text-gray-500">{group.educationLevel}</p>
                          </div>
                          <div className="text-sm text-gray-500 text-right">
                            <div>المعلم: {group.teacherName}</div>
                          </div>
                        </div>
                      </div>

                      {/* Attendance Table */}
                      <div className="p-4">
                        <GroupAttendanceTable 
                          groupId={group.id}
                          studentId={scannedProfile.id}
                          studentType={scannedProfile.type}
                          studentName={scannedProfile.name}
                          refreshTrigger={attendanceRefreshTrigger}
                          groupPaymentStatus={groupPaymentStatus}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>لا توجد مجموعات مسجل فيها</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">إحصائيات الحضور</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="text-sm">حاضر</span>
                    <span className="font-semibold text-green-600">
                      {scannedProfile.attendanceStats?.presentCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="text-sm">غائب</span>
                    <span className="font-semibold text-red-600">
                      {scannedProfile.attendanceStats?.absentCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="text-sm">متأخر</span>
                    <span className="font-semibold text-yellow-600">
                      {scannedProfile.attendanceStats?.lateCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="text-sm">إجمالي الحصص</span>
                    <span className="font-semibold text-blue-600">
                      {scannedProfile.attendanceStats?.totalClasses || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">إحصائيات المدفوعات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="text-sm">مدفوع</span>
                    <span className="font-semibold text-green-600">
                      {scannedProfile.paymentStats?.paidCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="text-sm">غير مدفوع</span>
                    <span className="font-semibold text-red-600">
                      {scannedProfile.paymentStats?.unpaidCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="text-sm">إجمالي المبلغ</span>
                    <span className="font-semibold text-blue-600">
                      {scannedProfile.paymentStats?.totalAmount || 0} دج
                    </span>
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
                    {scannedProfile.enrolledGroups && scannedProfile.enrolledGroups.length > 0 ? scannedProfile.enrolledGroups.map((group) => (
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
                    )) : (
                      <div className="text-center text-gray-500 py-4">
                        لا توجد مجموعات مسجل فيها
                      </div>
                    )}
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
                            {getMonthName(payment.month)} {payment.year}
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
                      <Printer className="h-5 w-5" />
                      طابعة إيصال الدفع
                    </CardTitle>
                    <CardDescription>
                      تحديد المجموعات والأشهر لإنشاء إيصال دفع شامل
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Groups Selection */}
                    <div>
                      <Label className="text-base font-medium">اختيار المجموعات والأشهر</Label>
                      <div className="mt-3 space-y-4">
                        {loadingGroups ? (
                          <div className="text-center py-4">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">جاري تحميل المجموعات...</p>
                          </div>
                        ) : availableGroups.length > 0 ? (
                          <>
                            <div className="mb-2 p-2 bg-blue-50 rounded text-sm">
                              <strong>Debug:</strong> Found {availableGroups.length} groups: {JSON.stringify(availableGroups.map(g => ({id: g.id, name: g.name})))}
                            </div>
                            {availableGroups.map((group: any) => (
                            <div key={group.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    id={`group-${group.id}`}
                                    checked={selectedGroups[group.id] !== undefined}
                                    onChange={(e) => handleGroupSelection(group.id, e.target.checked)}
                                    className="ml-2"
                                  />
                                  <label htmlFor={`group-${group.id}`} className="cursor-pointer">
                                    <div className="font-medium">{group.name}</div>
                                    <div className="text-sm text-gray-600">
                                      {group.subjectName || group.nameAr} - {group.educationLevel}
                                    </div>
                                  </label>
                                </div>
                              </div>
                              
                              {selectedGroups[group.id] && (
                                <div className="border-t pt-3">
                                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                    الأشهر المراد دفعها:
                                  </Label>
                                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                    {Array.from({length: 12}, (_, i) => i + 1).map((month) => {
                                      // Use unified payment status for consistent data across components
                                      const isPaid = groupPaymentStatus[group.id]?.[month] === true;
                                      const isSelected = selectedGroups[group.id]?.months.includes(month) || false;
                                      
                                      return (
                                        <label 
                                          key={month} 
                                          className={`flex items-center space-x-2 cursor-pointer p-2 rounded text-sm transition-colors ${
                                            isPaid 
                                              ? 'bg-green-100 text-green-800 border border-green-200' 
                                              : 'bg-gray-50 hover:bg-gray-100'
                                          } ${isSelected && !isPaid ? 'ring-2 ring-blue-400' : ''}`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleMonthToggle(group.id, month)}
                                            className="ml-1"
                                            disabled={isPaid}
                                          />
                                          <span className={`${isPaid ? 'font-medium' : ''}`}>
                                            {getMonthName(month)}
                                            {isPaid && <span className="mr-1 text-green-600">✓</span>}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                  
                                  {/* Payment Status Summary */}
                                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                                    <div className="flex justify-between items-center mb-1">
                                      <span>الأشهر المدفوعة:</span>
                                      <span className="text-green-600 font-medium">
                                        {Object.values(groupPaymentStatus[group.id] || {}).filter(Boolean).length} من 12
                                      </span>
                                    </div>
                                    {(() => {
                                      const unifiedPaidMonths = Object.entries(groupPaymentStatus[group.id] || {})
                                        .filter(([_, isPaid]) => isPaid)
                                        .map(([month, _]) => parseInt(month))
                                        .sort((a, b) => a - b);
                                      
                                      return unifiedPaidMonths.length > 0 && (
                                        <div className="text-green-700">
                                          {unifiedPaidMonths.map(m => getMonthName(m)).join(', ')}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  {selectedGroups[group.id]?.months.length > 0 && (
                                    <div className="mt-2 text-sm text-blue-600">
                                      الأشهر المحددة: {selectedGroups[group.id].months.map(m => getMonthName(m)).join(', ')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            ))}
                          </>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">
                              <strong>Debug Info:</strong><br/>
                              Available groups: {availableGroups.length}<br/>
                              Loading: {loadingGroups ? 'Yes' : 'No'}<br/>
                              Profile ID: {scannedProfile?.id}<br/>
                              Profile type: {scannedProfile?.type}<br/>
                              Has enrolledGroups: {scannedProfile?.enrolledGroups ? scannedProfile.enrolledGroups.length : 'undefined'}
                            </div>
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p>لا توجد مجموعات متاحة لهذا الطالب</p>
                            
                            {user?.role === 'admin' && (
                              <div className="mt-4 space-y-2">
                                <Button 
                                  onClick={createTestStudent}
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs block"
                                >
                                  إنشاء طالب تجريبي مع مجموعة
                                </Button>
                                <Button 
                                  onClick={async () => {
                                    try {
                                      // Check actual payment data in database for student ID 1
                                      const testResults = [];
                                      for (let month = 1; month <= 12; month++) {
                                        try {
                                          const response = await fetch(`/api/groups/1/payment-status/2025/${month}`);
                                          if (response.ok) {
                                            const data = await response.json();
                                            const studentPayment = data.find(p => p.studentId === 1 && p.studentType === 'student');
                                            if (studentPayment?.isPaid) {
                                              testResults.push(`${month} - مدفوع`);
                                            }
                                          }
                                        } catch (err) {
                                          // Skip month if API call fails
                                        }
                                      }
                                      
                                      const paidMonths = testResults.length > 0 ? testResults.join(', ') : 'لا توجد أشهر مدفوعة';
                                      console.log('Real payment data for student 1:', paidMonths);
                                      
                                      toast({
                                        title: "حالة الدفع الحقيقية",
                                        description: `الأشهر المدفوعة فعلياً: ${paidMonths}`,
                                        duration: 5000
                                      });
                                    } catch (error: any) {
                                      console.error('Payment status check error:', error);
                                      toast({
                                        title: "خطأ في فحص حالة الدفع",
                                        description: "فشل في التحقق من البيانات الفعلية",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                  variant="secondary" 
                                  size="sm"
                                  className="text-xs block"
                                >
                                  فحص حالة الدفع الحقيقية
                                </Button>
                                <Button 
                                  onClick={async () => {
                                    try {
                                      // Test payment for October (month 10) for student 1 in group 1
                                      console.log('🧪 Creating test October payment...');
                                      const testPayment = await fetch('/api/scan-student-qr/create-ticket-payment', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        credentials: 'include',
                                        body: JSON.stringify({
                                          transactions: [{
                                            studentId: 1,
                                            studentType: 'student',
                                            groupId: 1,
                                            amount: 200000, // 2000 DZD in cents
                                            month: 10, // October
                                            year: 2025,
                                            notes: 'Test October payment',
                                            paymentMethod: 'cash'
                                          }],
                                          totalAmount: 2000,
                                          receiptId: `TEST-OCT-${Date.now()}`,
                                          studentName: 'طالب تجريبي'
                                        })
                                      });

                                      if (testPayment.ok) {
                                        const result = await testPayment.json();
                                        console.log('✅ Test October payment created:', result);
                                        
                                        // Refresh the student data
                                        if (scannedProfile) {
                                          await fetchStudentGroups();
                                        }
                                        
                                        toast({
                                          title: "تم إنشاء دفعة أكتوبر تجريبية",
                                          description: "أكتوبر يجب أن يظهر الآن باللون الأخضر مع علامة ✓",
                                          duration: 5000
                                        });
                                      } else {
                                        const errorText = await testPayment.text();
                                        console.error('❌ Test payment failed:', errorText);
                                        toast({
                                          title: "فشل إنشاء الدفعة التجريبية",
                                          description: errorText,
                                          variant: "destructive"
                                        });
                                      }
                                    } catch (error: any) {
                                      console.error('❌ Test payment error:', error);
                                      toast({
                                        title: "خطأ في إنشاء الدفعة التجريبية",
                                        description: error.message,
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs block"
                                >
                                  🧪 إنشاء دفعة أكتوبر تجريبية
                                </Button>
                                <Button 
                                  onClick={async () => {
                                    try {
                                      // Direct database check for October payment
                                      console.log('🔍 Checking October payment status directly...');
                                      const response = await fetch('/api/groups/1/payment-status/2025/10');
                                      
                                      if (response.ok) {
                                        const paymentData = await response.json();
                                        const student1Payment = paymentData.find(p => p.studentId === 1 && p.studentType === 'student');
                                        
                                        console.log('October payment data:', paymentData);
                                        console.log('Student 1 October payment:', student1Payment);
                                        
                                        const statusMsg = student1Payment?.isPaid ? 
                                          `✅ أكتوبر مدفوع - المبلغ: ${student1Payment.amount} دج` :
                                          '❌ أكتوبر غير مدفوع';
                                        
                                        toast({
                                          title: "حالة دفع أكتوبر",
                                          description: statusMsg,
                                          duration: 5000
                                        });
                                      } else {
                                        toast({
                                          title: "فشل فحص أكتوبر",
                                          description: "لا يمكن الوصول لبيانات الدفع",
                                          variant: "destructive"
                                        });
                                      }
                                    } catch (error) {
                                      console.error('Payment check error:', error);
                                      toast({
                                        title: "خطأ في فحص الدفع",
                                        description: "حدث خطأ في الاتصال",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                  variant="secondary" 
                                  size="sm"
                                  className="text-xs block"
                                >
                                  🔍 فحص أكتوبر مباشرة
                                </Button>
                                <Button 
                                  onClick={async () => {
                                    try {
                                      // Step 1: First create the October payment directly via API
                                      console.log('🔧 Creating October payment and checking immediately...');
                                      
                                      const createResponse = await fetch('/api/scan-student-qr/create-ticket-payment', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        credentials: 'include',
                                        body: JSON.stringify({
                                          transactions: [{
                                            studentId: 1,
                                            studentType: 'student',
                                            groupId: 1,
                                            amount: 150000, // 1500 DZD in cents
                                            month: 10, // October
                                            year: 2025,
                                            notes: 'Direct October test payment',
                                            paymentMethod: 'cash'
                                          }],
                                          totalAmount: 1500,
                                          receiptId: `DIRECT-OCT-${Date.now()}`,
                                          studentName: 'طالب مباشر'
                                        })
                                      });

                                      if (!createResponse.ok) {
                                        const errorText = await createResponse.text();
                                        throw new Error(`Payment creation failed: ${errorText}`);
                                      }

                                      const creationResult = await createResponse.json();
                                      console.log('✅ October payment created:', creationResult);

                                      // Step 2: Immediately check if payment shows in API
                                      await new Promise(resolve => setTimeout(resolve, 500)); // Brief wait
                                      const checkResponse = await fetch('/api/groups/1/payment-status/2025/10');
                                      
                                      if (checkResponse.ok) {
                                        const paymentData = await checkResponse.json();
                                        console.log('📊 Full October payment API response:', paymentData);
                                        
                                        const student1Payment = paymentData.find(p => p.studentId === 1 && p.studentType === 'student');
                                        console.log('🎯 Student 1 October specific data:', student1Payment);
                                        
                                        // Step 3: Update the frontend state immediately
                                        if (student1Payment?.isPaid) {
                                          setGroupPaymentStatus(prev => ({
                                            ...prev,
                                            1: {
                                              ...prev[1],
                                              10: true // Mark October as paid for group 1
                                            }
                                          }));

                                          // Also refresh the full data to be safe
                                          if (scannedProfile) {
                                            await fetchStudentGroups();
                                          }

                                          toast({
                                            title: "✅ أكتوبر تم إنشاؤه وتحديثه",
                                            description: `المبلغ: ${student1Payment.amount} دج - يجب أن يظهر أخضر الآن`,
                                            duration: 5000
                                          });
                                        } else {
                                          toast({
                                            title: "⚠️ تم إنشاء الدفع لكن لم يُحدث",
                                            description: "الدفع موجود في النظام لكن الواجهة لم تتحديث",
                                            variant: "destructive",
                                            duration: 5000
                                          });
                                        }
                                      }
                                      
                                    } catch (error) {
                                      console.error('❌ Direct payment test error:', error);
                                      toast({
                                        title: "خطأ في الاختبار المباشر",
                                        description: error.message,
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs block"
                                >
                                  🔧 إنشاء وتحديث أكتوبر مباشرة
                                </Button>
                                <Button 
                                  onClick={async () => {
                                    // Create mock test data for payment testing
                                    const mockProfile: StudentProfile = {
                                      id: 1,
                                      name: 'طالب تجريبي',
                                      type: 'student',
                                      verified: true,
                                      attendanceStats: {
                                        totalClasses: 0,
                                        presentCount: 0,
                                        absentCount: 0,
                                        lateCount: 0
                                      },
                                      paymentStats: {
                                        totalDue: 0,
                                        paidCount: 0,
                                        unpaidCount: 0,
                                        totalAmount: 0
                                      },
                                      enrolledGroups: [],
                                      recentAttendance: [],
                                      recentPayments: []
                                    };
                                    
                                    const mockGroups = {
                                      1: {
                                        groupName: 'مجموعة الرياضيات',
                                        subjectName: 'رياضيات',
                                        months: [1, 2]
                                      }
                                    };
                                    
                                    // Set test data
                                    setScannedProfile(mockProfile);
                                    setSelectedGroups(mockGroups);
                                    setPaymentAmount('1000');
                                    
                                    toast({
                                      title: "تم تحديد بيانات تجريبية",
                                      description: "يمكنك الآن اختبار إنشاء الإيصال"
                                    });
                                  }}
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs block"
                                >
                                  بيانات تجريبية للاختبار
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Details */}
                    <Separator />
                    <div>
                      <Label htmlFor="amount">المبلغ الإجمالي (دج)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0.00"
                        className="text-lg font-medium"
                      />
                      {getTotalSelectedMonths() > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                          إجمالي {getTotalSelectedMonths()} شهر - متوسط {paymentAmount ? (parseFloat(paymentAmount) / getTotalSelectedMonths()).toFixed(2) : '0'} دج/شهر
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="notes">ملاحظات</Label>
                      <Textarea
                        id="notes"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="ملاحظات إضافية..."
                        rows={2}
                      />
                    </div>

                    {/* Test Button for Payment */}
                    {user?.role === 'admin' && (
                      <div className="mb-4">
                        <Button 
                          onClick={() => {
                            // Create realistic test data without fake payment status
                            const mockProfile: StudentProfile = {
                              id: 1,
                              name: 'طالب تجريبي',
                              type: 'student',
                              verified: true,
                              attendanceStats: {
                                totalClasses: 0,
                                presentCount: 0,
                                absentCount: 0,
                                lateCount: 0
                              },
                              paymentStats: {
                                totalDue: 0,
                                paidCount: 0,
                                unpaidCount: 0,
                                totalAmount: 0
                              },
                              enrolledGroups: [
                                {
                                  id: 1,
                                  name: 'مجموعة العربية والرياضيات',
                                  subjectName: 'العربية والرياضيات',
                                  teacherName: 'أستاذ محمد',
                                  educationLevel: 'الابتدائي'
                                },
                                {
                                  id: 2,
                                  name: 'مجموعة العلوم',
                                  subjectName: 'علوم طبيعية',
                                  teacherName: 'أستاذة فاطمة',
                                  educationLevel: 'المتوسط'
                                }
                              ],
                              recentAttendance: [],
                              recentPayments: []
                            };
                            
                            // Set profile and trigger real data fetch
                            setScannedProfile(mockProfile);
                            setSelectedGroups({});
                            setPaymentAmount('');
                            
                            // This will trigger fetchStudentGroups which fetches real payment data
                            setTimeout(() => {
                              if (mockProfile) {
                                fetchStudentGroups();
                              }
                            }, 100);
                            
                            toast({
                              title: "تم تحميل طالب تجريبي",
                              description: "سيتم جلب حالة الدفع الحقيقية من قاعدة البيانات"
                            });
                          }}
                          variant="secondary" 
                          size="sm"
                          className="w-full"
                        >
                          🧪 بيانات تجريبية للاختبار
                        </Button>
                      </div>
                    )}

                    <Button 
                      onClick={generatePaymentTicket}
                      disabled={!paymentAmount || Object.keys(selectedGroups).length === 0 || getTotalSelectedMonths() === 0 || isProcessing}
                      className="w-full"
                      size="lg"
                    >
                      <Printer className="h-4 w-4 ml-2" />
                      {isProcessing ? 'جاري الإنشاء...' : 'إنشاء وطباعة إيصال الدفع'}
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

      {/* Payment Ticket Modal */}
      {showTicket && generatedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" id="payment-ticket">
            <div className="p-6" dir="rtl">
              {/* Ticket Header */}
              <div className="text-center border-b pb-4 mb-4">
                <div className="text-xl font-bold mb-2">إيصال دفع</div>
                <div className="text-lg font-semibold text-blue-600">
                  مؤسسة تعليمية
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  رقم الإيصال: {generatedTicket.receiptId}
                </div>
                <div className="text-sm text-gray-600">
                  تاريخ الدفع: {generatedTicket.paymentDate}
                </div>
              </div>

              {/* Student Information */}
              <div className="mb-4">
                <div className="font-semibold mb-2">معلومات الطالب:</div>
                <div className="bg-gray-50 p-3 rounded">
                  <div>الاسم: <span className="font-medium">{generatedTicket.studentName}</span></div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="mb-4">
                <div className="font-semibold mb-2">تفاصيل الدفع:</div>
                <div className="space-y-2">
                  {generatedTicket.groups.map((group: any, index: number) => (
                    <div key={index} className="bg-blue-50 p-3 rounded">
                      <div className="font-medium text-blue-800">{group.groupName}</div>
                      <div className="text-sm text-blue-600">{group.subjectName}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        الأشهر المدفوعة: {group.months.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span>المبلغ الإجمالي:</span>
                  <span className="text-xl font-bold text-green-600">
                    {generatedTicket.amount.toFixed(2)} دج
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>طريقة الدفع:</span>
                  <span>نقدي</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-500 border-t pt-3">
                شكراً لكم على دفع الرسوم في الوقت المحدد
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6 print:hidden">
                <Button 
                  onClick={printTicket}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة
                </Button>
                <Button 
                  onClick={() => setShowTicket(false)}
                  variant="outline"
                  className="flex-1"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}