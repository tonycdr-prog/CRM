# Airflow Velocity Testing - Complete App Capabilities

## Overview

A professional, UK regulation-compliant application for smoke control system testing, commissioning, and business management. Designed for fire safety engineers and technicians working on-site, available as both a web application and native mobile app (iOS/Android).

---

## Core Testing Features

### Smoke Control Damper Velocity Testing
- **Automated Grid Calculation**: Automatically determines 5x5, 6x6, or 7x7 measurement grid based on damper dimensions per BSRIA BG 49/2024 standards
- **Touch-Optimized Data Entry**: Large touch targets and keyboard navigation for efficient on-site use
- **Real-Time Average Calculation**: Instant velocity average computation as readings are entered
- **Multiple System Types**: Supports push, pull, and push-pull smoke control configurations
- **Visit Types**: Initial commissioning, annual inspection, remedial works, and final verification

### Stairwell Differential Pressure Testing
- **Multi-Standard Support**: BS EN 12101-6:2022, BS EN 12101-6:2005, BS 5588-4:1998
- **Pressure Classes**: Class A through F system configurations
- **Door Force Measurements**: Compliance checking against 100N/140N limits
- **Level-by-Level Recording**: Floor-by-floor pressure differential and door force measurements
- **Automatic Compliance Calculation**: Pass/fail determination based on selected standard

### Test Scenarios
- Doors closed testing
- Single door open scenarios
- Multiple doors open configurations
- Fire service override testing

---

## Compliance & Reporting

### UK Building Standards
- BS EN 12101-8:2020 (Smoke control dampers)
- BS EN 12101-6:2022 (Stairwell pressurisation)
- BS 5588-4:1998 (Smoke control in protected escape routes)
- BSRIA BG 49/2024 (Commissioning air systems)

### Professional PDF Reports
- Branded company reports with logo
- Executive summary generation
- Pass/fail compliance summaries
- Grid visualisation with readings
- Digital signature capture (tester and witness)
- Commissioning certificates
- Annual inspection reports

### Compliance Checklists
- Pre-test verification items
- Functional testing requirements
- Performance testing criteria
- Documentation requirements
- Reference to specific standard clauses

### Golden Thread Document Management
- Building Safety Act compliance
- Document version control
- Audit trail for all changes
- Structured document storage

---

## Business Management Platform (CRM)

### Client Management
- Company database with contact details
- Multiple contacts per client (different departments/offices)
- Multiple addresses per client (head office, regional offices, sites)
- Client priority levels (Standard, Preferred, VIP)
- Client types (Commercial, Residential, Public Sector)
- VAT numbers and account references
- Payment terms configuration

### Contract Management
- Service agreement tracking
- Contract value and billing frequency
- Start/end dates with renewal tracking
- Auto-renewal options
- SLA levels (Basic, Standard, Premium)
- Response and resolution time tracking
- Digital signature capability

### Job Scheduling
- Work order creation and tracking
- Job status workflow (Pending, Scheduled, In Progress, Completed, Cancelled)
- Priority levels (Low, Normal, High, Urgent)
- Job types (Testing, Installation, Repair, Maintenance)
- Engineer assignment
- Estimated and actual duration tracking
- Site access notes and parking information

### Quotes & Invoices
- Quote generation with line items
- Quote-to-invoice conversion
- Invoice tracking and status
- Payment recording
- VAT calculations
- PDF export

### Financial Tracking
- Expense recording with categories
- Receipt image capture
- Mileage claims
- Timesheet management
- Labour and materials cost tracking
- Profit margin calculation

---

## Staff & Resource Management

### Staff Directory
- Employee profiles with contact details
- Employment type (Full-time, Part-time, Contractor, Apprentice)
- Line manager hierarchy
- Emergency contact information
- National Insurance numbers
- Driving licence tracking with expiry dates

### Skills & Qualifications
- Skills matrix per employee
- Qualification tracking (NVQ, CSCS cards, etc.)
- Certification management with expiry dates
- Training records
- Competency levels

### Staff Scheduling
- Availability patterns
- Time-off requests
- Shift handovers
- Daily briefings

### Equipment & Vehicles
- Equipment inventory and tracking
- Calibration dates and expiry
- Vehicle fleet management
- Vehicle bookings
- Equipment reservations per job

---

## Intelligent Features

### Trend Analysis
- Historical velocity data charting (Recharts)
- Performance trending over time
- Building-level analytics
- Damper-level performance tracking

### Anomaly Detection
- MAD (Median Absolute Deviation) algorithm
- Automatic flagging of unusual readings
- Deviation highlighting from historical patterns

### Predictive Maintenance
- Velocity trend analysis
- Performance degradation detection
- Predictive readings pre-load based on history
- Maintenance scheduling recommendations

### Service Duration Analytics
- Average job duration by type
- Engineer productivity metrics
- Time-on-site analysis

---

## Project & Site Management

### Projects
- Multi-building project grouping
- Site address and client linking
- Main contractor tracking
- Building list management

### Damper Registry
- Unique damper identification
- Location tracking (building, floor, shaft)
- Damper dimensions storage
- System type classification
- Historical test linkage

### Damper Templates
- Reusable damper configurations
- Standard sizes and settings
- Quick-apply for common setups

### Floor Sequencing Mode
- Structured floor-by-floor testing
- Progress tracking through building
- Sequence completion status

---

## Data Management

### Export Options
- PDF report generation
- CSV data export
- JSON backup/restore
- ZIP archive downloads

### Offline Capability
- LocalStorage persistence
- Offline status indicator
- Delta sync with change queue
- Automatic sync on connectivity restoration

### Auto-Save
- Continuous data saving
- Save status indicator
- No data loss on connection issues

---

## User Experience

### Touch-Optimised Interface
- Large touch targets for field use
- Responsive design for all screen sizes
- Mobile-first approach

### Navigation
- Keyboard shortcuts for data entry
- Quick navigation between tests
- Breadcrumb trails

### Visual Feedback
- Auto-save indicators
- Offline status display
- Loading states
- Success/error notifications

### Image Documentation
- Damper photo capture (open/closed positions)
- Image annotation capability
- Photo attachment to tests

---

## Mobile App Features (Capacitor)

### Native Functionality
- iOS and Android deployment
- Camera integration for photos
- Splash screen branding
- Status bar customisation

### Offline-First Design
- Full functionality without connection
- Background sync when online
- Local data persistence

---

## Security & Authentication

### User Management
- Replit Auth integration
- Custom username/password option
- Session management

### Data Isolation
- Per-user data separation
- Shared demo data for training
- Role-based access potential

---

## Sample Data (Pre-loaded)

The app comes pre-loaded with realistic UK demo data:
- **8 Engineers** at various competency levels
- **6 Client Companies** across UK regions
- **9 Service Contracts**
- **6 Building Projects**
- **18 Jobs** with various statuses
- **Dampers and Test Records** with velocity readings

---

## Technical Stack

- **Frontend**: React 18+, TypeScript, Vite, shadcn/ui, Tailwind CSS
- **Backend**: Express.js, TypeScript, RESTful API
- **Database**: PostgreSQL with Drizzle ORM
- **Mobile**: Capacitor for iOS/Android
- **Charts**: Recharts
- **PDF**: jsPDF, html-to-image
- **Forms**: React Hook Form, Zod validation
