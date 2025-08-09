# Desktop Distribution Builder

This guide shows how to create distributable installers for the School Management Desktop App.

## Quick Start

### 1. Prepare for Build
```bash
# Ensure all dependencies are installed
npm install

# Generate icon assets (run once)
node electron/assets/build-icons.js
```

### 2. Build Web Application
```bash
# Build the web app first (required)
npm run build
```

### 3. Create Desktop Distributables

**Build for Current Platform:**
```bash
node electron/scripts/package.js
```

**Build for Specific Platform:**
```bash
# Windows installers
node electron/scripts/package.js win

# macOS installer  
node electron/scripts/package.js mac

# Linux packages
node electron/scripts/package.js linux
```

**Build for All Platforms:**
```bash
node electron/scripts/build.js all
```

## What Gets Built

### Windows
- **NSIS Installer** (.exe) - Full installer with desktop shortcut
- **Portable Executable** (.exe) - Run without installation
- **MSI Package** (.msi) - Enterprise deployment

### macOS
- **Disk Image** (.dmg) - Standard macOS installer
- **Application Bundle** (.app) - Drag-and-drop installation

### Linux
- **AppImage** (.AppImage) - Universal Linux app (run anywhere)
- **Debian Package** (.deb) - Ubuntu/Debian installation
- **RPM Package** (.rpm) - Red Hat/SUSE installation

## Output Location

All distributable files are created in:
```
desktop-dist/
├── win-unpacked/          # Windows unpacked files
├── mac/                   # macOS app bundle
├── linux-unpacked/        # Linux unpacked files
├── نظام إدارة المدارس Setup 1.0.0.exe    # Windows installer
├── نظام إدارة المدارس-1.0.0.dmg           # macOS installer
├── نظام إدارة المدارس-1.0.0.AppImage      # Linux AppImage
├── نظام إدارة المدارس_1.0.0_amd64.deb    # Debian package
└── نظام إدارة المدارس-1.0.0.x86_64.rpm   # RPM package
```

## Features Included

✅ **Complete School Management System**
- All existing PWA features work identically
- Student management and scheduling
- Teacher tools and communication
- Admin panel with full functionality

✅ **Desktop Enhancements**
- Native window management
- Arabic RTL menu system
- Platform-specific keyboard shortcuts
- System tray integration (planned)

✅ **Hardware Integration Ready**
- QR scanner hooks prepared
- Thermal printer interface ready
- File system operations enabled
- Database synchronization framework

## Installation Requirements

### Windows
- Windows 10 or later (64-bit/32-bit)
- 100MB free disk space
- Internet connection for initial setup

### macOS
- macOS 10.14 (Mojave) or later
- 100MB free disk space
- May require allowing "Apps from unidentified developers"

### Linux
- Ubuntu 18.04+ / equivalent distributions
- 100MB free disk space
- X11 or Wayland display server

## Distribution Notes

### Code Signing
For production distribution:
- Windows: Sign with Certificate Authority for Windows Defender compatibility
- macOS: Sign with Apple Developer Certificate for Gatekeeper compatibility
- Linux: No signing required

### Auto-Updates
The electron-builder configuration includes:
- GitHub Releases integration
- Automatic update checking
- Background download and installation

### Security
- Application runs with standard user privileges
- No admin/root access required
- Network access limited to school management API
- Local data encrypted and protected

## Development vs Production

**Development Build:**
```bash
# Quick build for testing
npx electron-builder --publish=never
```

**Production Build:**
```bash
# Full build with signing and publishing
npx electron-builder --publish=always
```

## Troubleshooting

**Build Fails:**
- Ensure web build completed successfully (`npm run build`)
- Check Node.js version (18+ required)
- Verify all dependencies installed

**Icons Missing:**
- Run `node electron/assets/build-icons.js` to regenerate
- For production, replace with proper PNG/ICO/ICNS files

**Platform-Specific Issues:**
- Windows: Install Visual Studio Build Tools if native modules fail
- macOS: Install Xcode Command Line Tools
- Linux: Install build-essential and required libraries

## Next Steps

1. **Test Distribution**: Install and test on target platforms
2. **Code Signing**: Set up certificates for production releases
3. **Auto-Updates**: Configure GitHub releases for automatic updates
4. **Hardware Integration**: Connect QR scanners and thermal printers
5. **Documentation**: Create user installation guides