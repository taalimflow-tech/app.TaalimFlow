import { useState, useRef, useEffect } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, RotateCcw } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function QRScanner({ onScan, onClose, isOpen }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    try {
      setError('');
      codeReaderRef.current = new BrowserQRCodeReader();
      
      // Get available video devices
      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
      setDevices(videoInputDevices);
      
      if (videoInputDevices.length > 0) {
        const deviceId = videoInputDevices[0].deviceId;
        setSelectedDeviceId(deviceId);
        await startScanning(deviceId);
      } else {
        setError('لم يتم العثور على كاميرا');
      }
    } catch (err) {
      console.error('Error initializing scanner:', err);
      setError('خطأ في تشغيل الكاميرا');
    }
  };

  const startScanning = async (deviceId?: string) => {
    if (!codeReaderRef.current || !videoRef.current) return;

    try {
      setIsScanning(true);
      setError('');
      
      const result = await codeReaderRef.current.decodeOnceFromVideoDevice(
        deviceId || selectedDeviceId,
        videoRef.current
      );
      
      if (result) {
        onScan(result.getText());
        onClose();
      }
    } catch (err: any) {
      console.error('Error scanning QR code:', err);
      if (err.name !== 'NotFoundException') {
        setError('خطأ في مسح الرمز');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsScanning(false);
  };

  const switchCamera = async () => {
    if (devices.length <= 1) return;
    
    const currentIndex = devices.findIndex(device => device.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDeviceId = devices[nextIndex].deviceId;
    
    setSelectedDeviceId(nextDeviceId);
    stopScanning();
    await startScanning(nextDeviceId);
  };

  const retry = () => {
    stopScanning();
    startScanning();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">مسح رمز QR للطالب</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {error ? (
            <div className="text-center space-y-4">
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
              <Button onClick={retry} className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />
                إعادة المحاولة
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                
                {/* Scanner overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500"></div>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  وجه الكاميرا نحو رمز QR الخاص بالطالب
                </p>
                
                {devices.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={switchCamera}
                    disabled={isScanning}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    تبديل الكاميرا
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}