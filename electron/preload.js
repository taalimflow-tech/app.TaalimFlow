const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App information
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // QR Code scanning
  scanQRCode: () => ipcRenderer.invoke('scan-qr-code'),
  
  // Printer operations
  printReceipt: (data) => ipcRenderer.invoke('print-receipt', data),
  
  // File operations
  selectFile: () => ipcRenderer.invoke('select-file'),
  
  // Settings and preferences
  openSettings: (callback) => {
    ipcRenderer.on('open-settings', callback);
    return () => ipcRenderer.removeListener('open-settings', callback);
  },
  
  // Hardware status
  getHardwareStatus: () => ipcRenderer.invoke('get-hardware-status'),
  
  // Database operations (for offline sync)
  syncDatabase: () => ipcRenderer.invoke('sync-database'),
  getOfflineStatus: () => ipcRenderer.invoke('get-offline-status'),
  
  // Notifications
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),
  
  // System integration
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // School-specific features
  exportData: (format, data) => ipcRenderer.invoke('export-data', { format, data }),
  importData: (filePath) => ipcRenderer.invoke('import-data', filePath),
  
  // Window management
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // Development helpers
  isDevelopment: () => ipcRenderer.invoke('is-development'),
  openDevTools: () => ipcRenderer.invoke('open-dev-tools')
});

// Desktop-specific feature detection
contextBridge.exposeInMainWorld('isElectron', true);

// Platform detection
contextBridge.exposeInMainWorld('platform', {
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux'
});

console.log('Electron preload script loaded successfully');