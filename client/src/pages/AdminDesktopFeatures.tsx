import { RoleProtection } from '@/components/RoleProtection';
import DesktopFeatures from '@/components/DesktopFeatures';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, ArrowLeft, Info } from 'lucide-react';
import { Link } from 'wouter';
import { useElectron } from '@/hooks/useElectron';

export default function AdminDesktopFeatures() {
  const electron = useElectron();

  return (
    <RoleProtection allowedRoles={['admin']}>
      <div className="px-4 py-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Monitor className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">ميزات سطح المكتب</h1>
              <p className="text-sm text-gray-600">اختبار وإدارة ميزات التطبيق المكتبي والأجهزة</p>
            </div>
          </div>
          
          <Link href="/admin">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              العودة للوحة الإدارة
            </Button>
          </Link>
        </div>

        {/* Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              معلومات هامة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">حول النسخة المكتبية:</h4>
              <ul className="text-sm text-gray-600 space-y-1 mr-4">
                <li>• النسخة المكتبية توفر ميزات إضافية مثل مسح الرموز والطباعة</li>
                <li>• يمكن تشغيل النسخة المكتبية بجانب النسخة المحمولة (PWA)</li>
                <li>• الميزات المتقدمة تتطلب أجهزة إضافية (ماسح QR، طابعة حرارية)</li>
                <li>• البيانات متزامنة بين النسختين المكتبية والمحمولة</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">الاستخدام الموصى به:</h4>
              <ul className="text-sm text-gray-600 space-y-1 mr-4">
                <li>• <strong>النسخة المكتبية:</strong> للمكاتب الإدارية مع إمكانية الطباعة ومسح الرموز</li>
                <li>• <strong>النسخة المحمولة (PWA):</strong> للطلاب والمعلمين على الأجهزة المحمولة</li>
                <li>• <strong>الاستخدام المختلط:</strong> كلا النسختين في نفس المؤسسة حسب الحاجة</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Desktop Features Component */}
        <DesktopFeatures />

        {/* Development Instructions */}
        {electron.isElectron && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>معلومات للمطورين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>البيئة الحالية:</strong> {electron.isElectron ? 'التطبيق المكتبي (Electron)' : 'متصفح الويب'}</p>
                <p><strong>النظام:</strong> {
                  electron.platform?.isWindows ? 'Windows' :
                  electron.platform?.isMac ? 'macOS' :
                  electron.platform?.isLinux ? 'Linux' : 'غير محدد'
                }</p>
                <div>
                  <p><strong>الميزات المتوفرة:</strong></p>
                  <ul className="mr-4 mt-1">
                    <li>• مسح QR: {electron.features.qrScanning ? 'متوفر' : 'غير متوفر'}</li>
                    <li>• الطباعة: {electron.features.printing ? 'متوفر' : 'غير متوفر'}</li>
                    <li>• عمليات الملفات: {electron.features.fileOperations ? 'متوفر' : 'غير متوفر'}</li>
                    <li>• المزامنة غير المتصلة: {electron.features.offlineSync ? 'متوفر' : 'غير متوفر'}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Future Features Roadmap */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>الميزات القادمة</CardTitle>
            <CardDescription>الميزات المخطط إضافتها للنسخة المكتبية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">أجهزة إضافية:</h4>
                <ul className="text-gray-600 space-y-1 mr-4">
                  <li>• طابعة بطاقات الطلاب</li>
                  <li>• ماسح باركود متقدم</li>
                  <li>• كاميرا للحضور التلقائي</li>
                  <li>• قارئ بطاقات ذكية</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">ميزات برمجية:</h4>
                <ul className="text-gray-600 space-y-1 mr-4">
                  <li>• نظام محاسبة متكامل</li>
                  <li>• تقارير مالية تلقائية</li>
                  <li>• مزامنة قواعد البيانات</li>
                  <li>• نسخ احتياطية محلية</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleProtection>
  );
}