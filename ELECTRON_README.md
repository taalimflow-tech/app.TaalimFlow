# School Management Desktop App

This directory contains the Electron foundation for the desktop version of the school management PWA.

## Development Setup

### Prerequisites
- Node.js 18+ installed
- All dependencies installed (`npm install`)

### Running the Desktop App in Development

1. **Start the web server:**
   ```bash
   npm run dev
   ```

2. **In a new terminal, start Electron:**
   ```bash
   node run-electron.js
   ```

   Or alternatively, you can run them separately:
   ```bash
   # Terminal 1: Start web server
   npm run dev
   
   # Terminal 2: Wait for web server to start, then run Electron
   npx electron electron/main.js
   ```

### Features Currently Available

#### ✅ Implemented
- Basic Electron wrapper around existing React PWA
- Native desktop menu system (Arabic RTL support)
- Window management and application lifecycle
- Security layer with context isolation
- Development hot reload support
- Platform detection (Windows/macOS/Linux)
- Desktop features detection and testing interface

#### 🚧 Planned for Implementation
- QR Code scanner integration
- Thermal printer support
- File import/export operations
- Offline database synchronization
- Auto-updater system
- Hardware device management

### File Structure

```
electron/
├── main.js          # Main Electron process
├── preload.js       # Security bridge between main and renderer
├── assets/          # Icons and resources
└── scripts/         # Build and deployment scripts

client/src/hooks/
└── useElectron.ts   # React hooks for Electron features

client/src/components/
└── DesktopFeatures.tsx   # Desktop features testing interface
```

### Testing Desktop Features

1. Log in as an admin user
2. Navigate to Admin Panel → Desktop Features
3. Test available features like QR scanning, printing, and file operations
4. View platform information and feature availability

### Building for Distribution

```bash
# Simple build for current platform
node build-desktop.js

# Build for specific platforms
node build-desktop.js windows    # Windows installers (.exe, .msi)
node build-desktop.js mac        # macOS installer (.dmg)
node build-desktop.js linux      # Linux packages (.AppImage, .deb)
node build-desktop.js all        # All platforms

# Advanced builds
node electron/scripts/build.js    # Full build script
node electron/scripts/package.js # Packaging only
```

**What Gets Built:**
- **Windows**: NSIS installer (.exe), MSI package, portable executable
- **macOS**: Disk image (.dmg), application bundle (.app)
- **Linux**: AppImage (.AppImage), Debian package (.deb), RPM package

**Output Location:** `desktop-dist/` folder

### Next Steps

1. **Hardware Integration**: Add support for USB QR scanners and thermal printers
2. **Financial Module**: Implement accounting and payment processing features
3. **Database Sync**: Add offline-first database with cloud synchronization
4. **Auto-Updates**: Configure automatic updates via GitHub releases
5. **Distribution**: Set up code signing and installation packages

### Development Notes

- The desktop app runs your existing React PWA unchanged
- All current web features work identically in the desktop version
- Desktop-specific features are additive, not replacing existing functionality
- The same codebase serves both web (PWA) and desktop (Electron) versions