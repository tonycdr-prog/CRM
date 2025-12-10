# Airflow Velocity Testing - Smoke Control Damper

## Overview

This application is a professional, UK regulation-compliant utility for visualising and documenting airflow velocity readings across smoke control dampers. It enables field technicians to perform compliant testing with automatic grid size calculation (5×5, 6×6, or 7×7) based on damper dimensions per BS EN 12101-8 and BSRIA BG 49/2024 standards. The tool supports on-site use with touch-friendly controls and is available as a web application and native mobile app (iOS/Android). The project aims to provide comprehensive reporting, trend analysis, and efficient workflow for commissioning, annual inspection, and reactive testing of smoke control systems.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is a single-page application built with **React 18+** and **TypeScript**, using **Vite** as the build tool. It leverages **shadcn/ui** with **Radix UI** primitives and **Tailwind CSS** for styling, following Material Design principles with custom design tokens. The UI is touch-optimized for field use on tablets and mobile devices, featuring a responsive grid layout. State management uses **React hooks** for local state and **TanStack Query** for server state, with **LocalStorage** for client-side data persistence.

**Key Features**:

-   **UK Regulation Compliance**: Automatic grid size calculation (5x5, 6x6, 7x7) based on damper dimensions per BS EN 12101-8 and BSRIA BG 49/2024.
-   **Professional Report System**: Comprehensive project documentation including company details, scope of works, system description, testing standards, executive summary, and pass/fail statistics.
-   **Trend Analysis & Historical Tracking**: Year-over-year velocity trend visualisation using Recharts, historical data grouping, and pass/fail trend indicators for floor-level dampers.
-   **Enhanced PDF Export**: Professional, selection-aware PDF generation with cover pages, standards sections, summary tables, individual test pages with grid visualisations, and trend charts for historical data. Optimised for performance and file size.
-   **Damper Image Documentation**: Camera integration for capturing damper conditions (open/closed positions), with images stored as base64 data URLs and included in PDF exports.
-   **Grouped Test History**: Tests are organised by building and date into expandable site visit cards, offering summary statistics and visit-level selection for bulk operations.
-   **Four-Tab Interface**: Report Setup, Damper Testing, Stairwell Pressure Testing, and Test History.
-   **Stairwell Differential Pressure Testing**: Compliant with BS EN 12101-6 and other relevant standards, supporting various system classifications and test scenarios. Features floor-by-floor measurements, live compliance checking, pressure thresholds, door opening force validation, and environmental condition tracking.
-   **Multi-Standard Support**: Support for multiple UK building standard versions (BS 5588-4:1978, BS 5588-4:1998, BS EN 12101-6:2022) to accommodate systems installed under different regulatory periods. Automatic class availability filtering based on selected standard, with superseded standard warnings. "Per design" class handling for BS EN 12101-6 Classes D-F.
-   **Data Backup & Restore**: JSON export/import functionality in Test History tab for backing up all test data with schema validation on import.
-   **Anomaly Detection**: Intelligent detection of unusual readings using MAD (Median Absolute Deviation) algorithm. Flags negative values, readings >12 m/s, and statistical outliers with visual badges and input highlighting.
-   **Keyboard Navigation**: Arrow key, Tab, and Enter key navigation for velocity grid inputs to speed up data entry.
-   **Duplicate Test**: Quick copy feature to duplicate test configurations (building, location, damper settings) for rapid multi-floor testing.
-   **Offline Status Indicator**: Visual indicator in header showing connection state for field use awareness.
-   **Signature Capture**: Canvas-based component (SignatureCapture.tsx) ready for witness sign-off integration in PDF exports.

### Backend

The backend is an **Express.js** application with **TypeScript**. It follows a **RESTful API** design, with routes defined in `server/routes.ts`. It uses `tsx` for development and `esbuild` for production bundling. The data layer uses an abstract storage interface, currently with an in-memory implementation (`MemStorage`) and prepared for database integration via **Drizzle ORM**.

### Mobile App Platform

The application is wrapped for native iOS and Android deployment using **Capacitor**. It supports iOS 13.0+ and Android 6.0+ (API 23+), including native camera access and splash screen management.

## External Dependencies

-   **Database**: Drizzle ORM (Type-safe SQL query builder), Drizzle Kit (schema management), @neondatabase/serverless (Neon PostgreSQL driver).
-   **UI & Styling**: Tailwind CSS, shadcn/ui, Radix UI, class-variance-authority, Lucide React (icons).
-   **Form Handling**: React Hook Form, @hookform/resolvers, Zod (validation).
-   **Data Export**: html-to-image, jsPDF, JSZip.
-   **Routing**: wouter.
-   **Utilities**: date-fns, clsx, tailwind-merge, nanoid.
-   **Mobile App**: Capacitor (core), @capacitor/app, @capacitor/splash-screen, @capacitor/status-bar, @capacitor/camera.