import { Pause, PhoneCall, Mail, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ServiceSuspendedProps {
  schoolName?: string;
}

export default function ServiceSuspended({ schoolName }: ServiceSuspendedProps) {
  const handleContactSupport = () => {
    // You can add actual contact information here
    window.open("tel:+213XXXXXXXXX", "_self");
  };

  const handleEmailSupport = () => {
    window.open("mailto:support@schoolapp.dz", "_self");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <Pause className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <CardTitle className="text-xl text-gray-900 dark:text-white">
              الخدمة متوقفة مؤقتاً
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {schoolName ? `تم إيقاف الخدمة مؤقتاً لمدرسة ${schoolName}` : "تم إيقاف الخدمة مؤقتاً لهذه المدرسة"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800 dark:text-orange-200 text-right">
                  <p className="font-medium mb-1">لماذا تم إيقاف الخدمة؟</p>
                  <p>
                    قد يكون هناك مشكلة في الاشتراك أو إجراءات صيانة مجدولة. 
                    يرجى التواصل مع فريق الدعم الفني لمزيد من المعلومات.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                للمساعدة، يمكنك التواصل معنا:
              </p>
              
              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={handleContactSupport}
                  className="w-full"
                  variant="outline"
                >
                  <PhoneCall className="w-4 h-4 ml-2" />
                  اتصل بالدعم الفني
                </Button>
                
                <Button 
                  onClick={handleEmailSupport}
                  className="w-full"
                  variant="outline"
                >
                  <Mail className="w-4 h-4 ml-2" />
                  راسلنا عبر البريد الإلكتروني
                </Button>
              </div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
              نعتذر عن هذا الإزعاج ونعمل على حل المشكلة في أقرب وقت ممكن
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}