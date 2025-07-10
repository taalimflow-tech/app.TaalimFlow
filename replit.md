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
- **January 2025**: Successfully implemented comprehensive children registration and management system
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