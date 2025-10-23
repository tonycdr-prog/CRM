# Airflow Velocity Testing - Smoke Control Damper

## Overview

This is a professional utility application for visualizing and documenting airflow velocity readings across smoke control dampers. The tool enables field technicians to record 8 measurement points in a standardized grid pattern, automatically calculate averages, and export compliance documentation. The application is designed for on-site use with touch-friendly controls and focuses on precision and reliability over decorative elements.

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
- 8-position reading input grid (2×4 layout)
- Automatic average calculation
- Test metadata capture (date, location, floor, shaft ID, tester name, notes)
- Test history panel with CRUD operations
- Export functionality:
  - Individual test export (PNG image)
  - Bulk export (ZIP with PNG images)
  - PDF export support via jsPDF
- Visualization overlay on damper diagram image

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

**Data Storage Schema**:
```typescript
Test {
  id: string
  testDate: string
  location: string
  floorNumber: string
  shaftId: string
  testerName: string
  notes: string
  readings: (number | "")[]  // Array of 8 readings
  average: number
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