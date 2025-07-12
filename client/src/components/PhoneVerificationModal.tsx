import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { X, Phone, MessageCircle, CheckCircle } from 'lucide-react';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  onVerificationSuccess: () => void;
}

export function PhoneVerificationModal({
  isOpen,
  onClose,
  phoneNumber,
  onVerificationSuccess
}: PhoneVerificationModalProps) {
  const [step, setStep] = useState<'send' | 'verify' | 'success'>('send');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  const sendVerificationCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber })
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
          description: data.message
        });

        // Show development code if available (for testing)
        if (data.developmentCode) {
          toast({
            title: 'رمز التطوير',
            description: `رمز التحقق: ${data.developmentCode}`,
            variant: 'default'
          });
        }
      } else {
        throw new Error(data.error || 'حدث خطأ');
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
        title: 'رمز التحقق مطلوب',
        description: 'يرجى إدخال رمز التحقق',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phoneNumber, 
          code: verificationCode.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
        toast({
          title: 'تم التحقق بنجاح',
          description: data.message
        });
        
        // Call success callback after a brief delay
        setTimeout(() => {
          onVerificationSuccess();
          onClose();
        }, 2000);
      } else {
        throw new Error(data.error || 'حدث خطأ');
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

  const handleResendCode = () => {
    setStep('send');
    setVerificationCode('');
    setCountdown(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            تحقق من رقم الهاتف
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'send' && (
            <>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">تحقق من رقم هاتفك</h3>
                <p className="text-sm text-gray-600">
                  سنرسل رمز التحقق إلى الرقم: <span className="font-mono">{phoneNumber}</span>
                </p>
              </div>
              
              <Button
                onClick={sendVerificationCode}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
              </Button>
            </>
          )}

          {step === 'verify' && (
            <>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">أدخل رمز التحقق</h3>
                <p className="text-sm text-gray-600">
                  تم إرسال رمز التحقق إلى <span className="font-mono">{phoneNumber}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">رمز التحقق</Label>
                <Input
                  id="verification-code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="أدخل رمز التحقق المكون من 6 أرقام"
                  className="text-center text-lg font-mono"
                  maxLength={6}
                  dir="ltr"
                />
              </div>

              <Button
                onClick={verifyCode}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'جاري التحقق...' : 'تحقق'}
              </Button>

              <div className="text-center space-y-2">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-500">
                    إعادة الإرسال خلال {countdown} ثانية
                  </p>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleResendCode}
                    className="text-sm"
                  >
                    إعادة إرسال الرمز
                  </Button>
                )}
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg text-green-700">تم التحقق بنجاح!</h3>
              <p className="text-sm text-gray-600">
                تم تأكيد رقم هاتفك بنجاح
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}