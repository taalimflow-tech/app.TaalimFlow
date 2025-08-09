const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const { autoUpdater } = require('electron-updater');

// Enable live reload for Electron in development
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

class SchoolManagementApp {
  constructor() {
    this.mainWindow = null;
    this.isQuitting = false;
  }

  async createMainWindow() {
    // Create the main application window
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: !isDev
      },
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      show: false, // Don't show until ready-to-show
      icon: path.join(__dirname, 'assets', 'icon.png')
    });

    // Load the app
    if (isDev) {
      // Development: load from Vite dev server
      await this.mainWindow.loadURL('http://localhost:5000');
      this.mainWindow.webContents.openDevTools();
    } else {
      // Production: load from built files
      await this.mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      // Focus on window creation
      if (isDev) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  createApplicationMenu() {
    const template = [
      {
        label: 'ملف',
        submenu: [
          {
            label: 'نافذة جديدة',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.createMainWindow()
          },
          { type: 'separator' },
          {
            label: 'إعدادات',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              this.mainWindow.webContents.send('open-settings');
            }
          },
          { type: 'separator' },
          {
            label: process.platform === 'darwin' ? 'إنهاء التطبيق' : 'خروج',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              this.isQuitting = true;
              app.quit();
            }
          }
        ]
      },
      {
        label: 'تحرير',
        submenu: [
          { label: 'تراجع', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
          { label: 'إعادة', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
          { type: 'separator' },
          { label: 'قص', accelerator: 'CmdOrCtrl+X', role: 'cut' },
          { label: 'نسخ', accelerator: 'CmdOrCtrl+C', role: 'copy' },
          { label: 'لصق', accelerator: 'CmdOrCtrl+V', role: 'paste' }
        ]
      },
      {
        label: 'عرض',
        submenu: [
          { label: 'إعادة تحميل', accelerator: 'CmdOrCtrl+R', role: 'reload' },
          { label: 'إعادة تحميل قسري', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
          { label: 'أدوات المطور', accelerator: 'F12', role: 'toggleDevTools' },
          { type: 'separator' },
          { label: 'تكبير فعلي', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
          { label: 'تكبير', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
          { label: 'تصغير', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
          { type: 'separator' },
          { label: 'ملء الشاشة', accelerator: 'F11', role: 'togglefullscreen' }
        ]
      },
      {
        label: 'نافذة',
        submenu: [
          { label: 'تصغير', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
          { label: 'إغلاق', accelerator: 'CmdOrCtrl+W', role: 'close' }
        ]
      },
      {
        label: 'مساعدة',
        submenu: [
          {
            label: 'حول التطبيق',
            click: () => {
              dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'حول نظام إدارة المدارس',
                message: 'نظام إدارة المدارس الخاصة',
                detail: `الإصدار: ${app.getVersion()}\nمنصة شاملة لإدارة المؤسسات التعليمية الخاصة`
              });
            }
          },
          {
            label: 'تحقق من التحديثات',
            click: () => {
              autoUpdater.checkForUpdatesAndNotify();
            }
          }
        ]
      }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { label: 'حول ' + app.getName(), role: 'about' },
          { type: 'separator' },
          { label: 'خدمات', role: 'services', submenu: [] },
          { type: 'separator' },
          { label: 'إخفاء ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
          { label: 'إخفاء الآخرين', accelerator: 'Command+Shift+H', role: 'hideothers' },
          { label: 'إظهار الكل', role: 'unhide' },
          { type: 'separator' },
          { label: 'خروج', accelerator: 'Command+Q', click: () => app.quit() }
        ]
      });

      // Window menu
      template[4].submenu = [
        { label: 'إغلاق', accelerator: 'CmdOrCtrl+W', role: 'close' },
        { label: 'تصغير', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'تكبير', role: 'zoom' },
        { type: 'separator' },
        { label: 'إحضار للمقدمة', role: 'front' }
      ];
    }

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  }

  setupIPC() {
    // Handle QR code scanning requests
    ipcMain.handle('scan-qr-code', async () => {
      // This will be implemented when we add QR scanner functionality
      return { success: false, message: 'QR scanner not yet implemented' };
    });

    // Handle printer operations
    ipcMain.handle('print-receipt', async (event, data) => {
      // This will be implemented when we add printer functionality
      return { success: false, message: 'Printer not yet implemented' };
    });

    // Handle file operations
    ipcMain.handle('select-file', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
          { name: 'Documents', extensions: ['pdf', 'doc', 'docx'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      return result;
    });

    // Handle app info requests
    ipcMain.handle('get-app-info', () => {
      return {
        version: app.getVersion(),
        platform: process.platform,
        isDevMode: isDev
      };
    });
  }

  setupAutoUpdater() {
    if (!isDev) {
      // Configure auto-updater
      autoUpdater.checkForUpdatesAndNotify();

      autoUpdater.on('update-available', () => {
        dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'تحديث متوفر',
          message: 'يتوفر إصدار جديد من التطبيق',
          detail: 'سيتم تنزيل التحديث في الخلفية وسيتم إشعارك عند اكتماله.'
        });
      });

      autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'تحديث جاهز',
          message: 'تم تنزيل التحديث وهو جاهز للتثبيت',
          detail: 'سيتم إعادة تشغيل التطبيق لتطبيق التحديث.',
          buttons: ['إعادة التشغيل الآن', 'لاحقاً']
        }).then((result) => {
          if (result.response === 0) {
            autoUpdater.quitAndInstall();
          }
        });
      });
    }
  }

  async initialize() {
    // Wait for app to be ready
    await app.whenReady();

    // Create main window
    await this.createMainWindow();

    // Set up application menu
    this.createApplicationMenu();

    // Set up IPC handlers
    this.setupIPC();

    // Set up auto-updater
    this.setupAutoUpdater();

    // Handle app activation (macOS)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    // Handle all windows closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin' || this.isQuitting) {
        app.quit();
      }
    });

    // Prevent multiple instances
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      // Someone tried to run a second instance, focus our window instead
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.focus();
      }
    });
  }
}

// Create and initialize the app
const schoolApp = new SchoolManagementApp();
schoolApp.initialize().catch(console.error);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox('خطأ غير متوقع', error.message);
});