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
The application uses a hybrid approach:
- **User management**: Stored in both Firebase and PostgreSQL
- **Content data**: Announcements, blog posts, teachers stored in PostgreSQL
- **Real-time data**: Messages, suggestions stored in Firebase Firestore
- **File storage**: Images and assets in Firebase Storage

This architecture provides the benefits of Firebase's real-time capabilities while maintaining relational data integrity in PostgreSQL for structured content.