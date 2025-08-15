# Progressive Web App (PWA) for Private Schools and Training Centers

## Overview
This Progressive Web App (PWA) is a React-based mobile portal for private schools and training centers, offering full Arabic support with RTL layout. It aims to streamline communication and management within educational institutions, providing features for announcements, blog posts, teacher communication, suggestions, and learning groups. The project's vision is to enhance digital engagement and administrative efficiency in the private education sector.

## Recent Changes (August 2025)
- **Application Startup Issues Resolved**: Fixed TypeScript compilation errors that were preventing the application from starting
- **Database Connection Established**: Created PostgreSQL database and configured environment variables (DATABASE_URL, PGPORT, etc.)
- **Schema Synchronization**: Updated database schema with latest changes using `npm run db:push`
- **Multi-tenancy Compliance**: Added missing `schoolId` fields to suggestion, group, teacher, and message schemas for proper data isolation
- **Attendance System Fixes**: Corrected field name issues in group attendance system (attendanceDate vs date)
- **Type Safety Improvements**: Resolved major TypeScript errors across server-side components

## User Preferences
Preferred communication style: Simple, everyday language in English. User prefers English communication over other languages.
Security preference: Code-based school access instead of public school directory for enhanced privacy and security.
Interface preference: Phone verification functionality removed from Profile page for simplified user experience (December 2024).

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom Arabic-optimized design system, utilizing Radix UI primitives and shadcn/ui components
- **State Management**: React Context for authentication, TanStack Query for server state
- **PWA Features**: Service Worker, Web App Manifest, and offline caching capabilities for a robust mobile experience.
- **UI/UX Decisions**: Responsive design optimized for Arabic RTL, mobile-first bottom navigation, and professional, clean interfaces with specific color-coding for educational levels (e.g., Green for Primary, Blue for Middle, Purple for Secondary). Static designs are preferred over animated or complex visual effects for administrative interfaces. Gregorian dating is used throughout the application.

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for data persistence and consistency.
- **Authentication**: Firebase Authentication integrated with custom user roles and session-based security for multi-tenancy.
- **File Storage**: Firebase Storage for images and assets.

### Key Features and Implementations
- **Authentication System**: Firebase Authentication, role-based access control (admin, teacher, user), and session-based security for multi-tenancy. Includes comprehensive password reset and email/SMS verification.
- **QR Code System**: Unique QR code generation for verified students and children with role-based access control. QR codes are only generated after user verification by admins.
- **Multi-Tenancy**: Complete data isolation per school via `schoolId` across all database tables. Super admin manages school creation and access keys. Users access schools via secure school codes instead of public directory listing.
- **Core Features**: Home dashboard, blog system, teacher communication, suggestions/feedback, learning groups/formations management, and a comprehensive admin panel for content and user management.
- **PWA Functionality**: Installable app with manifest, service worker for offline use, and push notifications.
- **Data Flow**: TanStack Query for client-side caching, Express routes with Drizzle ORM for server-side data, Firebase Storage for files.
- **User Management**: Role-based access for students, parents, teachers, and admins. Includes student and child registration, user verification (document-based for students/children), and user banning functionality with comprehensive access prevention.
- **Communication & Content**: Announcement and blog systems, messaging between users, and a comprehensive notification system.
- **Group & Formation Management**: Creation and management of learning groups and training courses, including student assignment, attendance tracking, and financial management per group. Supports mixed assignment of direct students and children. Implements intelligent year-based filtering where "جميع المستويات" (all levels) groups appear for all year selections within their education level, while specific-year groups only show for their designated year. Standardized teaching module grade format across all education levels (short format without "السنة" prefix) with support for secondary specializations (علمي، أدبي، تسيير واقتصاد، تقني رياضي).
- **Scheduling System**: Comprehensive schedule management with independent grids per classroom, 30-minute intervals, precise time control, and color-coded displays.
- **Reporting**: Admin interface for managing user reports and banning users.
- **Subject Management**: Complete Algerian education curriculum with proper Arabic subject names organized by education level (الابتدائي, المتوسط, الثانوي), totaling 28 specialized teaching modules covering all standard subjects from primary through secondary education including engineering specializations.
- **Desktop QR Scanner**: Real-time student profile lookup system for admins and teachers using webcam or USB scanner integration. Features comprehensive student information display, quick attendance marking, payment recording capabilities, and integrated test QR code generation for development. Fully operational with support for both students and children QR codes (August 2025).
- **Payment Ticket Printer System**: Comprehensive receipt generation system integrated with desktop QR scanner allowing admins to select multiple enrolled groups, choose payment months per group, enter amounts, and generate professional printed receipts. Includes school name, student information, detailed payment breakdown by group/subject/months, receipt ID, payment date, and automatic payment record creation across database tables. Features real-time payment tracking with visual indicators showing paid/unpaid months with green highlighting and checkmarks for authentic database-sourced payment status (August 2025).
- **Financial Reports & Analytics**: Complete gains/losses calculation system for school financial analysis. Features comprehensive revenue tracking, expense estimation, profit margins, monthly breakdowns, and group performance analytics. Provides detailed insights including total revenue, net profit calculations, average revenue per student, monthly financial trends, and individual group profitability analysis for data-driven decision making (August 2025).

## External Dependencies

- **Firebase**: Used for Authentication (email verification, phone verification, password reset), File Storage (Firebase Storage), and real-time data needs (though primarily transitioning to PostgreSQL for core data).
- **PostgreSQL**: The primary relational database for content, user data (beyond authentication), groups, schedules, and financial transactions. Utilizes Neon for serverless deployment.
- **Drizzle ORM**: Used for object-relational mapping with PostgreSQL, including Zod for validation.
- **React**: Frontend framework.
- **Wouter**: Client-side routing.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Radix UI**: Unstyled component primitives.
- **shadcn/ui**: Component library built on Radix UI.
- **TanStack Query**: For server state management and caching.
- **Express.js**: Backend server framework.
- **Google Fonts**: Specifically Noto Sans Arabic, for optimized Arabic typography.
- **Vite**: Frontend build tool.
- **ESBuild**: Server-side bundling.
- **PostCSS**: CSS post-processor.