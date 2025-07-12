# Progressive Web App (PWA) for Private Schools and Training Centers

## Overview

This is a Progressive Web App (PWA) built with React that serves as a mobile portal for private schools and training centers. The application provides full Arabic support with RTL (Right-to-Left) layout and includes features for announcements, blog posts, teacher communication, suggestions, and learning groups management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom Arabic-optimized design system
- **UI Components**: Radix UI primitives with shadcn/ui components
- **State Management**: React Context for authentication, TanStack Query for server state
- **PWA Features**: Service Worker, Web App Manifest, offline caching

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Authentication with custom user roles
- **Data Storage**: Firebase Firestore for real-time data
- **File Storage**: Firebase Storage for images and assets

### Key Components

1. **Authentication System**
   - Firebase Authentication integration
   - Role-based access control (admin, teacher, user)
   - Custom user context and hooks

2. **Layout Components**
   - Header with navigation and notifications
   - Bottom navigation for mobile-first design
   - Responsive layout optimized for Arabic RTL

3. **Core Features**
   - Home dashboard with announcements
   - Blog system with admin publishing
   - Teacher communication portal
   - Suggestions/feedback system
   - Learning groups and formations management
   - Admin panel for content management

4. **PWA Features**
   - Installable app with manifest.json
   - Service worker for offline functionality
   - Push notifications support
   - Responsive design for mobile devices

## Data Flow

### Authentication Flow
1. User attempts to access protected routes
2. AuthWrapper checks authentication status
3. If not authenticated, redirects to login
4. Firebase handles authentication
5. User profile fetched from Firestore
6. Role-based permissions applied

### Data Management
- **Client-side**: TanStack Query for caching and synchronization
- **Server-side**: Express routes with Drizzle ORM queries
- **Real-time**: Firebase Firestore for live updates
- **File uploads**: Firebase Storage integration

## External Dependencies

### Primary Dependencies
- **Firebase**: Authentication, Firestore, Storage
- **Database**: PostgreSQL with Neon serverless
- **ORM**: Drizzle ORM with Zod validation
- **UI Library**: Radix UI with shadcn/ui components
- **Fonts**: Google Fonts (Noto Sans Arabic)

### Development Tools
- **Build**: Vite for development and production builds
- **TypeScript**: Full type safety across the stack
- **ESBuild**: Server-side bundling
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

### Build Process
1. **Client Build**: Vite builds React app to `dist/public`
2. **Server Build**: ESBuild bundles Express server to `dist/index.js`
3. **Database**: Drizzle migrations applied to PostgreSQL

### Environment Configuration
- **Development**: Local development with Vite dev server
- **Production**: Express serves static files and API routes
- **Database**: PostgreSQL connection via DATABASE_URL
- **Firebase**: Configuration via environment variables

### Key Features for Deployment
- **PWA Manifest**: Configures app installation
- **Service Worker**: Handles offline functionality
- **Arabic Support**: RTL layout with proper font loading
- **Mobile Optimization**: Touch-friendly interface design
- **Push Notifications**: Integrated notification system

### Database Schema
The application now uses a unified PostgreSQL database approach:
- **User management**: PostgreSQL with Firebase Auth for authentication
- **Content data**: Announcements, blog posts, teachers stored in PostgreSQL
- **Application data**: Messages, suggestions, groups, formations stored in PostgreSQL
- **Registration data**: Group and formation registrations stored in PostgreSQL
- **File storage**: Images and assets in Firebase Storage

#### Database Tables:
- `users` - User profiles with phone numbers and roles
- `announcements` - School announcements and news
- `blog_posts` - Blog content with publishing status
- `teachers` - Teacher profiles and availability
- `messages` - Communication between users and teachers
- `suggestions` - User feedback and suggestions
- `groups` - Learning groups and activities
- `formations` - Training courses and programs
- `group_registrations` - Group enrollment data
- `formation_registrations` - Course enrollment data

This unified approach provides better data consistency, easier queries, and improved performance while maintaining the authentication benefits of Firebase.

## Recent Changes
- **January 2025**: Updated teaching module system to reflect accurate Algerian education structure
  - **Primary Education (الابتدائي)**: 3 subjects - Arabic+Math combined, French, English
  - **Middle School (المتوسط)**: 7 subjects for all 4 grades - Arabic, Math, Physics, Natural Sciences, French, English, History+Geography
  - **Secondary Education (الثانوي)**: 21 consolidated subjects - teachers can teach across all secondary levels/branches:
    - Core subjects for all tracks: Arabic, French, English, Math, Philosophy, History+Geography, Islamic Studies, Physical Education, Artistic Education, Computer Science
    - Scientific track subjects: Physics, Natural Sciences, Civil Engineering
    - Technical track subjects: Mechanics, Electrical Engineering  
    - Languages track subjects: German, Spanish
    - Economics track subjects: Economics, Law, Accounting
    - Literary track subjects: Civic Education
  - **Total: 31 modules** (3 primary + 7 middle + 21 secondary)
  - Eliminated duplicate subjects - teachers now select one subject they can teach across all applicable secondary levels
  - Corrected subject combinations: History+Geography as one subject, no separate chemistry (part of Natural Sciences)
  - Teachers can specialize in subjects across entire education levels matching real Algerian system
- **January 2025**: Successfully implemented comprehensive children registration and management system
- **January 2025**: Refined verification system to focus only on children and students
  - **IMPORTANT**: Verification system now applies only to children and students, not teachers, admins, or regular users
  - Removed user verification requirements and endpoints - only children and students need document verification
  - Added verified lists functionality with separate endpoints for verified children and students
  - Created comprehensive AdminVerification page with 4 tabs: unverified children, unverified students, verified children, verified students
  - Updated database storage methods to support refined verification scope
  - Added verification fields (verified, verificationNotes, verifiedAt, verifiedBy) to children and students tables
  - System supports document verification workflow specifically for legitimate students and children who visit school
  - Verification process includes admin notes and automatic notifications to verified users
  - Fixed 404 routing error by replacing problematic Radix UI Dialog with custom modal implementation
- **January 2025**: Enhanced authentication error handling with comprehensive user feedback
  - Fixed server crash issue by removing error throwing in error handler
  - Added specific Arabic error messages for all authentication scenarios
  - Improved login validation with clear messages for empty fields
  - Enhanced error display with password field clearing on failed attempts
  - Added proper validation messages for wrong email/password combinations
  - Implemented detailed error handling for admin and teacher login processes
  - Fixed type mismatches between frontend and backend User interfaces
  - Added children table to database schema with parent relationship
  - Updated registration form to support up to 5 children per parent
  - Changed "User Name" to "Parent Name" in registration forms
  - Added complete education level system (الابتدائي, المتوسط, الثانوي) with proper grades
  - Implemented profile page with children management (view, add, remove)
  - Added children API endpoints for CRUD operations
  - Fixed chat system with custom modal implementation (removed problematic Radix UI Dialog)
  - Database migration completed successfully for children table
  - **Fixed bulk messaging system**: Users now properly receive admin messages
  - **Added comprehensive admin content management**: 
    - Created AdminContent.tsx with tabbed interface for blogs, groups, formations, teachers
    - Added proper routing for /admin/content path
    - Implemented form validation and success notifications
    - Added navigation between admin users and content management
    - Fixed button visibility and styling issues
  - **Critical Database Integration Fix**: Fixed all content pages to use PostgreSQL instead of Firebase
    - Updated Blog.tsx to fetch admin-created blog posts from PostgreSQL
    - Updated Groups.tsx to fetch admin-created groups from PostgreSQL with join functionality
    - Updated Formations.tsx to fetch admin-created formations from PostgreSQL with registration
    - Admin-created content now properly appears in الخدمات السريعة (Quick Services) section
    - Added proper user registration functionality for groups and formations
    - Enhanced user experience with loading states and success notifications
  - **Comprehensive Notification System Implementation**:
    - Added notifications table to database with user targeting and read status
    - Created NotificationPanel component with role-based notification types
    - Updated Header with notification bell and unread count badge
    - Added automatic notification creation for key events (suggestions, messages, blogs, announcements, groups, formations)
    - Implemented clickable notifications that navigate to related content
    - Added proper Arabic text and RTL support for notifications
    - Fixed suggestions system to use PostgreSQL API instead of Firebase
    - **Admin Suggestions Management**: Created AdminSuggestions page for viewing user suggestions
    - **Role-based UI**: Removed suggestions feature from admin navigation (admins can view but not submit)
    - Enhanced admin panel with proper navigation to all management sections
  - **Student User Type Implementation**: Added complete student registration system
    - Created students table in database with education level and grade fields
    - Added student registration tab in Login component with dedicated form
    - Students can register with personal info plus education level and grade
    - Updated Profile page to hide children management section for students
    - Added purple badge color and proper role handling for students
    - Database schema includes proper relationships and validation
  - **UI/UX Improvements**: Fixed overlapping elements and improved login page layout
    - Expanded login card width from max-w-md to max-w-2xl for better spacing
    - Added proper grid layouts for form fields (2-column on desktop, 1-column on mobile)
    - Improved children registration section with scrollable area and better organization
    - Added visual separators and better spacing throughout all registration tabs
    - Enhanced student registration tab with organized sections for personal and academic info
    - Added proper borders, padding, and visual hierarchy improvements
  - **Complete Login Flow Redesign**: Replaced tabbed interface with step-by-step user flow
    - Step 1: Choose between "Login" or "Create New Account" with large, clear buttons
    - Step 2: For registration, choose user type (Parent or Student) with visual icons
    - Step 3: Show appropriate form based on selected action and user type
    - Added proper navigation with back buttons between steps
    - Clean, intuitive interface with clear headings and descriptions for each step
    - Maintained all existing functionality while improving user experience
    - Removed confusing tabs and replaced with guided workflow
  - **Logout Functionality**: Added logout buttons for better user experience
    - Added logout icon button in header next to profile button for quick access
    - Added dedicated logout section in Profile page with clear button and description
    - Both buttons properly call the logout function from AuthContext
  - **AdminLogin Page Redesign**: Applied same step-by-step approach to admin/teacher login
    - Replaced cramped 4-column tab layout with clean step-by-step flow
    - Step 1: Choose Login vs Register with clear buttons
    - Step 2: Choose Admin vs Teacher with visual icons and descriptions
    - Step 3: Display appropriate forms with proper spacing and organization
    - Added grid layouts for registration forms with better field organization
    - Maintained all existing functionality while improving user experience
  - **Role-Based Access Control Implementation**: Fixed security issue with admin access
    - Created separate AdminAuthWrapper for admin-only routes
    - Split routing into UserRoutes and AdminRoutes for proper access control
    - Admin users can only access admin features through /admin-login
    - Regular users cannot access admin panel even if they know the URL
    - Proper role verification before allowing access to admin features
    - Updated logout function to redirect users to appropriate login page based on role
    - Bottom navigation correctly shows/hides admin features based on user role
    - **TESTED AND WORKING**: Admin users are automatically logged out and redirected to admin login panel if they try to login through student panel
    - System enforces strict role-based access with proper session management and user redirection
- **January 2025**: Replaced all Hijri dating with Gregorian dating across the entire application
  - Changed all `toLocaleDateString('ar-SA')` and `toLocaleDateString('ar-DZ')` instances to `toLocaleDateString('en-US')`
  - Updated date formatting in AdminVerification, Profile, AdminSuggestions, NotificationPanel, AdminContent, and AdminUsers pages
  - All dates now display in standard Gregorian format (MM/DD/YYYY) instead of Islamic calendar format
  - This change provides consistent date display that matches international standards
- **January 2025**: Removed verification status display for admins and teachers in profiles
  - Verification status is now only shown for students in their profiles
  - Admins and teachers no longer see "non-validated account" messages or verification badges
  - This aligns with the system design where only students and children need document verification
  - Profile pages now conditionally show verification status based on user role
- **January 2025**: Implemented comprehensive schedule management system
  - **Database Schema**: Added `schedule_tables` and `schedule_cells` tables for multiple independent schedule grids
  - **Admin Interface**: Created full schedule management with classroom tables (e.g., "Salle 1", "Salle 2")
  - **Interactive Grid**: Each table has days × periods grid with + buttons for adding classes
  - **Education Level Integration**: Schedule cells support education level selection (Primary/Middle/Secondary)
  - **Subject & Teacher Assignment**: Each cell can be assigned a subject and teacher with duration options
  - **Duration Support**: Cells can span multiple periods (1.5h, 3h, 4.5h) with automatic cell extension
  - **Color-coded Display**: Schedule cells use education level colors (Green=Primary, Blue=Middle, Purple=Secondary)
  - **CRUD Operations**: Full create, read, update, delete functionality for both tables and cells
  - **Teacher Integration**: Teachers are filtered by education level specializations when assigning to cells
  - **Real-time Updates**: Changes reflect immediately with proper state management
  - **Arabic Professional Titles**: Teachers display with proper Arabic titles (الأستاذ/الأستاذة)
  - **Admin-only Access**: Schedule management restricted to admin users only
  - **API Routes**: Complete REST API endpoints for schedule tables and cells management
- **January 2025**: Updated AdminVerification UI to be static and clean
  - Removed all gradients, animations, and fancy effects from the AdminVerification page
  - Replaced glassmorphism and backdrop blur effects with simple borders and backgrounds
  - Simplified tab design with clean, static styling
  - Removed all hover animations, scaling effects, and transition animations
  - Updated modal dialogs to use clean, minimal styling without gradients or shadows
  - Changed to simple gray/white color scheme with subtle green accents for verified items
  - Removed all emoji decorations and visual flourishes for a professional appearance
  - Made verification cards more static and clean by removing duplicate verification status badges
  - Reduced card padding and simplified layout with smaller buttons and badges
  - Kept only essential information: type badge, name/ID, and education level
  - Changed button text from "المعلومات" to "تفاصيل" for verified items for consistency
  - Updated badge colors to improve Arabic text visibility: changed from dark backgrounds to light colored backgrounds with darker text (blue-100/blue-800 for children, purple-100/purple-800 for students)
  - Reduced text sizes throughout AdminVerification UI: card titles from text-lg to text-sm, descriptions from text-sm to text-xs, and other elements for better compactness
  - Added RTL (Right-to-Left) orientation using dir="rtl" attribute for all Arabic text sections including card headers and modal content
- **January 2025**: Completely redesigned schedule system with clean, form-based approach
  - **Clean Static Table Layout**: Removed messy cell interactions and made professional static grid
  - **Simplified Time Headers**: Changed from complex time ranges to simple numbers (8 | 9 | 10 | 11 | 12 | 13)
  - **Form-Based Lesson Creation**: Replaced cell clicking with dedicated "إضافة حصة جديدة" button above table
  - **Day & Period Selection**: Added dropdowns for selecting specific day and time period in form
  - **Automatic Cell Population**: Form automatically places lessons in correct table cells based on selections
  - **Arabic Schedule Layout**: Weekdays listed vertically (starting with Friday) with times horizontally
  - **Enhanced Duration Options**: Added 2 hours option to duration selection (1.5h, 2h, 3h, 4.5h)
  - **Professional Grid Design**: Clean borders, proper spacing, and static layout without hover effects
  - **Grade Selection Integration**: Maintained detailed grade selection (Primary 1-5, Middle 1-4, Secondary 1-3)
  - **Teacher Filtering**: Teachers filtered by education level specializations in form
  - **Streamlined Workflow**: Simplified from complex cell interactions to straightforward form submission
- **January 2025**: Enhanced schedule system with precise time control and extended hours
  - **Custom Time Inputs**: Replaced period selection with start/end time input fields for precise lesson timing
  - **Automatic Period Calculation**: System automatically determines table placement based on start time
  - **Extended Time Range**: Schedule now spans from 8 AM to 10 PM (22:00) with 15 time periods
  - **Visual Time Representation**: Lessons display exact custom times and span correct number of columns
  - **Duration Auto-Calculation**: Lesson duration calculated automatically from start and end times
  - **Database Integration**: Added startTime and endTime fields to schedule cells table