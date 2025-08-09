import { useState, useEffect } from 'react';

// Type definitions for Electron API
declare global {
  interface Window {
    electronAPI?: {
      // App information
      getAppInfo: () => Promise<{
        version: string;
        platform: string;
        isDevMode: boolean;
      }>;
      
      // QR Code scanning
      scanQRCode: () => Promise<{
        success: boolean;
        data?: string;
        message?: string;
      }>;
      
      // Printer operations
      printReceipt: (data: any) => Promise<{
        success: boolean;
        message?: string;
      }>;
      
      // File operations
      selectFile: () => Promise<{
        canceled: boolean;
        filePaths: string[];
      }>;
      
      // Hardware status
      getHardwareStatus: () => Promise<{
        qrScanner: boolean;
        printer: boolean;
      }>;
      
      // Database operations
      syncDatabase: () => Promise<boolean>;
      getOfflineStatus: () => Promise<boolean>;
      
      // Notifications
      showNotification: (title: string, body: string) => Promise<void>;
      
      // System integration
      openExternal: (url: string) => Promise<void>;
      
      // Export/Import
      exportData: (format: string, data: any) => Promise<{
        success: boolean;
        filePath?: string;
      }>;
      importData: (filePath: string) => Promise<{
        success: boolean;
        data?: any;
      }>;
      
      // Development
      isDevelopment: () => Promise<boolean>;
      openDevTools: () => Promise<void>;
    };
    isElectron?: boolean;
    platform?: {
      isWindows: boolean;
      isMac: boolean;
      isLinux: boolean;
    };
  }
}

interface ElectronFeatures {
  isElectron: boolean;
  isReady: boolean;
  platform: {
    isWindows: boolean;
    isMac: boolean;
    isLinux: boolean;
  } | null;
  features: {
    qrScanning: boolean;
    printing: boolean;
    fileOperations: boolean;
    notifications: boolean;
    offlineSync: boolean;
  };
  api: Window['electronAPI'] | null;
}

export const useElectron = (): ElectronFeatures => {
  const [electronFeatures, setElectronFeatures] = useState<ElectronFeatures>({
    isElectron: false,
    isReady: false,
    platform: null,
    features: {
      qrScanning: false,
      printing: false,
      fileOperations: false,
      notifications: false,
      offlineSync: false,
    },
    api: null,
  });

  useEffect(() => {
    const checkElectronEnvironment = async () => {
      const isElectron = Boolean(window.isElectron);
      const platform = window.platform || null;
      const api = window.electronAPI || null;

      if (isElectron && api) {
        try {
          // Check available features
          const hardwareStatus = await api.getHardwareStatus?.() || {
            qrScanner: false,
            printer: false,
          };

          setElectronFeatures({
            isElectron: true,
            isReady: true,
            platform,
            features: {
              qrScanning: hardwareStatus.qrScanner || true, // Enable even if hardware not detected
              printing: hardwareStatus.printer || true,
              fileOperations: true,
              notifications: true,
              offlineSync: true,
            },
            api,
          });
        } catch (error) {
          console.warn('Error checking Electron features:', error);
          setElectronFeatures({
            isElectron: true,
            isReady: true,
            platform,
            features: {
              qrScanning: true,
              printing: true,
              fileOperations: true,
              notifications: true,
              offlineSync: true,
            },
            api,
          });
        }
      } else {
        // Running in web browser
        setElectronFeatures({
          isElectron: false,
          isReady: true,
          platform: null,
          features: {
            qrScanning: false,
            printing: false,
            fileOperations: false,
            notifications: 'Notification' in window,
            offlineSync: false,
          },
          api: null,
        });
      }
    };

    checkElectronEnvironment();
  }, []);

  return electronFeatures;
};

// Convenience hooks for specific features
export const useQRScanner = () => {
  const { isElectron, features, api } = useElectron();
  
  const scanQRCode = async (): Promise<{
    success: boolean;
    data?: string;
    message?: string;
  }> => {
    if (!isElectron || !features.qrScanning || !api) {
      return {
        success: false,
        message: 'QR scanning not available in web version'
      };
    }
    
    try {
      return await api.scanQRCode();
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'QR scan failed'
      };
    }
  };

  return {
    isAvailable: isElectron && features.qrScanning,
    scanQRCode,
  };
};

export const usePrinter = () => {
  const { isElectron, features, api } = useElectron();
  
  const printReceipt = async (data: any): Promise<{
    success: boolean;
    message?: string;
  }> => {
    if (!isElectron || !features.printing || !api) {
      return {
        success: false,
        message: 'Printing not available in web version'
      };
    }
    
    try {
      return await api.printReceipt(data);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Print failed'
      };
    }
  };

  return {
    isAvailable: isElectron && features.printing,
    printReceipt,
  };
};

export const useFileOperations = () => {
  const { isElectron, features, api } = useElectron();
  
  const selectFile = async () => {
    if (!isElectron || !features.fileOperations || !api) {
      // Fallback to web file input
      return new Promise<{ canceled: boolean; filePaths: string[] }>((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = () => {
          resolve({
            canceled: !input.files?.length,
            filePaths: input.files ? Array.from(input.files).map(f => f.name) : []
          });
        };
        input.click();
      });
    }
    
    return await api.selectFile();
  };

  const exportData = async (format: string, data: any) => {
    if (!isElectron || !api) {
      // Fallback to browser download
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    }
    
    return await api.exportData(format, data);
  };

  return {
    isAvailable: isElectron && features.fileOperations,
    selectFile,
    exportData,
  };
};