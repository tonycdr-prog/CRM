# Airflow Velocity Testing - Smoke Control Damper

## Overview
This application provides a professional, UK regulation-compliant utility for visualizing and documenting airflow velocity readings across smoke control dampers. It automates grid size calculation (5x5, 6x6, or 7x7) based on damper dimensions per BS EN 12101-8 and BSRIA BG 49/2024 standards. The tool is designed for on-site use with touch-friendly controls and is available as a web and native mobile application (iOS/Android). Its purpose is to streamline commissioning, annual inspection, and reactive testing of smoke control systems by offering comprehensive reporting, trend analysis, and efficient workflows. The project aims to enhance compliance, provide valuable insights into system performance, and improve field technician efficiency.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application features a **React 18+** and **TypeScript** frontend, built with **Vite**, using **shadcn/ui**, **Radix UI**, and **Tailwind CSS** for a touch-optimized, responsive UI. State management utilizes **React hooks** and **TanStack Query**, with **LocalStorage** for client-side persistence. The backend is an **Express.js** application with **TypeScript**, following a **RESTful API** design. It uses **Drizzle ORM** for PostgreSQL database access. The mobile application is wrapped for native iOS and Android deployment using **Capacitor**.

**Key Architectural Features:**
*   **Compliance & Reporting**: Automatic grid size calculation, professional PDF report generation with certifications, and comprehensive project documentation. Includes support for multiple UK building standards (e.g., BS EN 12101-6, BS 5588-4) and features for stairwell differential pressure testing.
*   **Data Management**: Trend analysis with Recharts, historical data tracking, data backup/restore via JSON, CSV export, and Golden Thread document management for Building Safety Act compliance.
*   **Workflow Enhancements**: Damper image documentation with annotation, grouped test history, duplicate test functionality, damper templates, and a "Floor Sequencing Mode" for structured testing. Streamlined navigation with URL parameter pre-filling for creating jobs from contracts/quotes (e.g., `/jobs?createJob=true&clientId=X`), dashboard quick actions linking directly to create dialogs, and "Convert to Job" action on quotes in the finance page.
*   **Intelligent Features**: Anomaly detection using MAD algorithm, predictive maintenance through velocity trend analysis, and predictive readings pre-load with deviation highlighting.
*   **User Experience**: Touch-optimized interface, keyboard navigation for data entry, offline status indicator, signature capture, and auto-save indicator.
*   **Business Management Platform**: Integrated CRM for client and contract management, job scheduling, quotes/invoices, expense/timesheet tracking, asset/equipment management, and technician certification tracking. Includes features for sales pipeline, tender management, incident reporting, risk assessments, and recurring jobs.
*   **Synchronization**: Offline delta sync with a change queue system that tracks modifications and syncs to the server upon connectivity restoration.

## External Dependencies
*   **Database**: Drizzle ORM, Drizzle Kit, @neondatabase/serverless (Neon PostgreSQL driver).
*   **UI & Styling**: Tailwind CSS, shadcn/ui, Radix UI, class-variance-authority, Lucide React.
*   **Form Handling**: React Hook Form, @hookform/resolvers, Zod.
*   **Data Export**: html-to-image, jsPDF, JSZip.
*   **Routing**: wouter.
*   **Utilities**: date-fns, clsx, tailwind-merge, nanoid.
*   **Mobile App**: Capacitor (core), @capacitor/app, @capacitor/splash-screen, @capacitor/status-bar, @capacitor/camera.