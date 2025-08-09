import { useElectron, useQRScanner, usePrinter, useFileOperations } from '@/hooks/useElectron';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Printer, FileText, Download, Monitor, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DesktopFeatures() {
  const electron = useElectron();
  const qrScanner = useQRScanner();
  const printer = usePrinter();
  const fileOps = useFileOperations();
  const { toast } = useToast();

  if (!electron.isReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">جاري تحميل ميزات سطح المكتب...</p>
        </div>
      </div>
    );
  }

  const handleQRScan = async () => {
    const result = await qrScanner.scanQRCode();
    if (result.success) {
      toast({
        title: "تم مسح الرمز بنجاح",
        description: `البيانات: ${result.data}`,
      });
    } else {
      toast({
        title: "فشل في مسح الرمز",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handlePrintTest = async () => {
    const testData = {
      type: 'receipt',
      title: 'إيصال تجريبي',
      content: 'هذا إيصال تجريبي لاختبار الطابعة',
      timestamp: new Date().toLocaleString('ar-EG'),
    };

    const result = await printer.printReceipt(testData);
    if (result.success) {
      toast({
        title: "تم الطباعة بنجاح",
        description: "تم طباعة الإيصال التجريبي",
      });
    } else {
      toast({
        title: "فشل في الطباعة",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async () => {
    const result = await fileOps.selectFile();
    if (!result.canceled && result.filePaths.length > 0) {
      toast({
        title: "تم اختيار الملف",
        description: `الملف: ${result.filePaths[0]}`,
      });
    }
  };

  const handleDataExport = async () => {
    const sampleData = {
      exportDate: new Date().toISOString(),
      schoolName: 'مدرسة تجريبية',
      totalStudents: 150,
      totalTeachers: 12,
      groups: [
        { name: 'مجموعة الرياضيات', students: 25 },
        { name: 'مجموعة العلوم', students: 30 },
      ]
    };

    const result = await fileOps.exportData('json', sampleData);
    if (result.success) {
      toast({
        title: "تم تصدير البيانات",
        description: "تم حفظ الملف بنجاح",
      });
    }
  };

  if (!electron.isElectron) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            النسخة المحمولة (PWA)
          </CardTitle>
          <CardDescription>
            أنت تستخدم النسخة المحمولة من التطبيق. للحصول على ميزات إضافية مثل مسح الرموز والطباعة، استخدم النسخة المكتبية.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>مسح الرموز</span>
              <Badge variant="secondary">غير متوفر</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>الطباعة</span>
              <Badge variant="secondary">غير متوفر</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>عمليات الملفات المتقدمة</span>
              <Badge variant="secondary">محدود</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>المزامنة غير المتصلة</span>
              <Badge variant="secondary">غير متوفر</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            النسخة المكتبية
          </CardTitle>
          <CardDescription>
            أنت تستخدم النسخة المكتبية مع إمكانية الوصول إلى الأجهزة والميزات المتقدمة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium">النظام:</span>
              <p className="text-sm text-gray-600">
                {electron.platform?.isWindows && 'Windows'}
                {electron.platform?.isMac && 'macOS'}
                {electron.platform?.isLinux && 'Linux'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium">الحالة:</span>
              <Badge variant="outline" className="mr-2">متصل</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            ماسح الرموز
          </CardTitle>
          <CardDescription>
            مسح الرموز الخاصة بالطلاب والمعاملات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">
                الحالة: <Badge variant={qrScanner.isAvailable ? "default" : "secondary"}>
                  {qrScanner.isAvailable ? "متوفر" : "غير متوفر"}
                </Badge>
              </p>
            </div>
            <Button 
              onClick={handleQRScan}
              disabled={!qrScanner.isAvailable}
              size="sm"
            >
              مسح رمز QR
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Printer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            الطابعة
          </CardTitle>
          <CardDescription>
            طباعة الإيصالات وبطاقات الطلاب
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">
                الحالة: <Badge variant={printer.isAvailable ? "default" : "secondary"}>
                  {printer.isAvailable ? "متوفر" : "غير متوفر"}
                </Badge>
              </p>
            </div>
            <Button 
              onClick={handlePrintTest}
              disabled={!printer.isAvailable}
              size="sm"
            >
              طباعة تجريبية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            عمليات الملفات
          </CardTitle>
          <CardDescription>
            استيراد وتصدير البيانات والملفات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              onClick={handleFileSelect}
              disabled={!fileOps.isAvailable}
              size="sm"
              variant="outline"
            >
              اختيار ملف
            </Button>
            <Button 
              onClick={handleDataExport}
              disabled={!fileOps.isAvailable}
              size="sm"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              تصدير البيانات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص الميزات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span>مسح الرموز</span>
              <Badge variant={electron.features.qrScanning ? "default" : "secondary"}>
                {electron.features.qrScanning ? "✓" : "✗"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>الطباعة</span>
              <Badge variant={electron.features.printing ? "default" : "secondary"}>
                {electron.features.printing ? "✓" : "✗"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>عمليات الملفات</span>
              <Badge variant={electron.features.fileOperations ? "default" : "secondary"}>
                {electron.features.fileOperations ? "✓" : "✗"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>الإشعارات</span>
              <Badge variant={electron.features.notifications ? "default" : "secondary"}>
                {electron.features.notifications ? "✓" : "✗"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}