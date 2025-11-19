# Airflow Velocity Testing - Smoke Control Damper

## Overview

This is a professional UK regulation-compliant utility application for visualizing and documenting airflow velocity readings across smoke control dampers. The tool enables field technicians to perform compliant testing with automatic grid size calculation (5×5, 6×6, or 7×7) based on damper dimensions per BS EN 12101-8 and BSRIA BG 49/2024 standards. The application is designed for on-site use with touch-friendly controls and is available as both a web application and native mobile app (iOS/Android).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript using Vite as the build tool

**UI Component System**: 
- shadcn/ui component library (New York style variant) with Radix UI primitives
- Tailwind CSS for styling with custom design tokens following Material Design principles
- CSS variables for theming support (light/dark modes)

**Design Philosophy**:
- Single-page application optimized for field testing workflow
- Material Design with technical/engineering focus
- Touch-optimized interface for on-site tablet/mobile use
- Inter font family for UI with Roboto Mono for numeric precision
- Responsive grid layout: single column mobile (<768px), 2-column grid for readings on larger screens

**State Management**:
- React hooks for local component state
- TanStack Query (React Query) for server state management
- LocalStorage for client-side data persistence of test history

**Key Features**:
- **UK Regulation Compliance**: Automatic grid size calculation based on damper dimensions
  - Damper ≤ 610mm: 5×5 grid (25 measurement points)
  - Damper 610-914mm: 6×6 grid (36 measurement points)
  - Damper > 914mm: 7×7 grid (49 measurement points)
- Dynamic grid visualization adapting to test requirements
- Automatic average, minimum, and maximum velocity calculations
- Pass/fail criteria evaluation with configurable thresholds
- Test metadata capture (date, building, location, floor, shaft ID, system type, tester name, notes)
- Test history panel with CRUD operations
- Export functionality:
  - Individual test export (PNG image)
  - Bulk export (ZIP with PNG images)
  - PDF export support via jsPDF
- Geometric free area calculation from damper dimensions
- "Next Floor" workflow for efficient multi-floor testing

### Backend Architecture

**Server Framework**: Express.js with TypeScript

**Build & Development**:
- Development: tsx for TypeScript execution
- Production: esbuild for server bundling
- ESM module system throughout

**API Structure**:
- RESTful API design (all routes prefixed with `/api`)
- Routes defined in `server/routes.ts`
- Request/response logging middleware
- JSON body parsing with raw body capture support

**Data Layer**:
- Abstracted storage interface (`IStorage`) allowing multiple implementations
- In-memory storage (`MemStorage`) for development/testing
- Prepared for database integration via Drizzle ORM

**Session Management**:
- connect-pg-simple for PostgreSQL session storage (when database is connected)

### External Dependencies

**Database**:
- **Drizzle ORM** (v0.39.1): Type-safe SQL query builder
- **Drizzle Kit**: Schema management and migrations
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- Configured for PostgreSQL dialect
- Schema validation with Zod via drizzle-zod
- Connection string via `DATABASE_URL` environment variable
- Migrations output to `./migrations` directory

**UI & Styling**:
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **shadcn/ui**: Comprehensive component library built on Radix UI
- **Radix UI**: Unstyled, accessible component primitives (20+ packages)
- **class-variance-authority**: Type-safe variant styling
- **Lucide React**: Icon library

**Form Handling**:
- **React Hook Form**: Efficient form state management
- **@hookform/resolvers**: Schema validation resolvers
- **Zod**: Runtime type validation and schema definition

**Data Export**:
- **html-to-image**: DOM to image conversion (PNG export)
- **jsPDF**: PDF generation
- **JSZip**: ZIP file creation for bulk exports

**Routing**:
- **wouter**: Lightweight client-side routing (~1.2KB)

**Utilities**:
- **date-fns**: Date manipulation and formatting
- **clsx** & **tailwind-merge**: Conditional className composition
- **nanoid**: Unique ID generation

**Development Tools**:
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit integration
- **@replit/vite-plugin-dev-banner**: Development environment indicator

**Mobile App Platform**:
- **Capacitor** (v7.4.4): Native iOS and Android app wrapper
- **@capacitor/app**: App lifecycle events
- **@capacitor/splash-screen**: Native splash screen management
- **@capacitor/status-bar**: Status bar styling control
- Supports iOS 13.0+ and Android 6.0+ (API 23+)
- Full native app deployment to App Store and Google Play Store

**Data Storage Schema**:
```typescript
Test {
  id: string
  testDate: string
  building: string
  location: string
  floorNumber: string
  shaftId: string
  systemType: "" | "push" | "pull" | "push-pull"
  testerName: string
  notes: string
  readings: (number | "")[]  // Variable length: 25, 36, or 49 readings
  gridSize: number           // 5, 6, or 7
  average: number
  damperWidth?: number       // Width in mm
  damperHeight?: number      // Height in mm
  freeArea?: number         // Calculated geometric free area in m²
  createdAt: number
}
```

**Authentication Schema** (Prepared but not actively used):
```typescript
User {
  id: string (UUID)
  username: string (unique)
  password: string
}
```

## Mobile App Deployment

### Platform Support
- **iOS**: Minimum iOS 13.0, builds with Xcode 14+
- **Android**: Minimum API 23 (Android 6.0), builds with Android Studio

### Build Process
See `MOBILE_BUILD.md` for complete build and deployment instructions.

**Quick Start:**
1. Build web app: `npm run build`
2. Sync platforms: `npx cap sync`
3. Open native IDE: `npx cap open android` or `npx cap open ios`
4. Build and run from Android Studio or Xcode

### App Store Distribution
- **Google Play**: Build signed AAB in Android Studio
- **Apple App Store**: Archive and upload via Xcode

### Configuration
- App ID: `com.airflow.tester`
- App Name: "Airflow Velocity Tester"
- Edit `capacitor.config.ts` for customization