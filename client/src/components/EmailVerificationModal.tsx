import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle, Timer, ArrowRight } from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerificationSuccess: () => void;
}

export function EmailVerificationModal({
  isOpen,
  onClose,
  email,
  onVerificationSuccess
}: EmailVerificationModalProps) {
  const [step, setStep] = useState<'send' | 'verify' | 'success'>('send');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('send');
      setVerificationCode('');
      setCountdown(0);
    }
  }, [isOpen]);

  const sendVerificationCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('verify');
        setCountdown(60); // 1 minute countdown
        
        // Start countdown timer
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        toast({
          title: 'تم إرسال رمز التحقق',
          description: data.message || 'تم إرسال رمز التحقق إلى بريدك الإلكتروني'
        });

        // Show development code if available
        if (data.developmentCode) {
          toast({
            title: 'رمز التطوير',
            description: `رمز التحقق: ${data.developmentCode}`,
            variant: 'default'
          });
        }
      } else {
        throw new Error(data.error || 'حدث خطأ في إرسال الرمز');
      }
    } catch (error) {
      toast({
        title: 'خطأ في إرسال الرمز',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: 'خطأ في التحقق',
        description: 'يرجى إدخال رمز التحقق',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
        toast({
          title: 'تم التحقق بنجاح',
          description: data.message || 'تم التحقق من البريد الإلكتروني بنجاح'
        });
        
        // Call success callback after a short delay
        setTimeout(() => {
          onVerificationSuccess();
          onClose();
        }, 2000);
      } else {
        throw new Error(data.error || 'حدث خطأ في التحقق');
      }
    } catch (error) {
      toast({
        title: 'خطأ في التحقق',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {step === 'send' && <Mail className="w-12 h-12 text-blue-500" />}
            {step === 'verify' && <Timer className="w-12 h-12 text-orange-500" />}
            {step === 'success' && <CheckCircle className="w-12 h-12 text-green-500" />}
          </div>
          <CardTitle className="text-xl">
            {step === 'send' && 'تأكيد البريد الإلكتروني'}
            {step === 'verify' && 'أدخل رمز التحقق'}
            {step === 'success' && 'تم التحقق بنجاح'}
          </CardTitle>
          <CardDescription>
            {step === 'send' && `سيتم إرسال رمز التحقق إلى: ${email}`}
            {step === 'verify' && 'أدخل الرمز المرسل إلى بريدك الإلكتروني'}
            {step === 'success' && 'تم التحقق من البريد الإلكتروني بنجاح'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'send' && (
            <div className="space-y-4">
              <div className="text-center text-sm text-gray-600">
                سيتم إرسال رمز التحقق المكون من 6 أرقام إلى بريدك الإلكتروني
              </div>
              <Button 
                onClick={sendVerificationCode}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'جارٍ الإرسال...' : 'إرسال رمز التحقق'}
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="text-center">
                <Input
                  type="text"
                  placeholder="أدخل رمز التحقق المكون من 6 أرقام"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  dir="ltr"
                />
                {countdown > 0 && (
                  <div className="text-sm text-gray-500 mt-2">
                    يمكنك إعادة الإرسال خلال {countdown} ثانية
                  </div>
                )}
              </div>
              <Button 
                onClick={verifyCode}
                disabled={isLoading || !verificationCode.trim()}
                className="w-full"
              >
                {isLoading ? 'جارٍ التحقق...' : 'تأكيد'}
                <CheckCircle className="w-4 h-4 mr-2" />
              </Button>
              <Button 
                variant="outline"
                onClick={sendVerificationCode}
                disabled={isLoading || countdown > 0}
                className="w-full"
              >
                إعادة إرسال الرمز
              </Button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="text-green-600 font-medium">
                تم التحقق من البريد الإلكتروني بنجاح!
              </div>
              <div className="text-sm text-gray-600">
                سيتم إغلاق هذه النافذة تلقائياً...
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              onClick={onClose}
              disabled={isLoading}
            >
              إغلاق
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}