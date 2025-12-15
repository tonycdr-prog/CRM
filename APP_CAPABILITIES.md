# Airflow Velocity Testing - Complete App Capabilities

*A demonstration guide showing exactly what this application can do*

---

## Overview

This is a professional, UK regulation-compliant application for smoke control system testing, commissioning, and business management. It's designed for fire safety engineers and technicians working on-site, available as both a web application and native mobile app (iOS/Android).

**Who is this for?** Fire safety contractors, commissioning engineers, building services consultants, and smoke ventilation specialists who need to test smoke control dampers and stairwell pressurisation systems to UK standards.

---

## Core Testing Features

### Smoke Control Damper Velocity Testing

**What it does:** Measures and documents airflow velocity readings across smoke control dampers to verify they meet design specifications.

**How to use it:**

1. **Create a new test** - Navigate to the Testing section and tap "New Damper Test"
2. **Enter damper dimensions** - Input the width and height in millimetres (e.g., 600mm x 400mm)
3. **Watch the grid auto-calculate** - The system automatically determines whether you need a 5x5, 6x6, or 7x7 measurement grid based on BSRIA BG 49/2024 standards:
   - Dampers under 0.5m²: 5x5 grid (25 readings)
   - Dampers 0.5m² to 1.0m²: 6x6 grid (36 readings)
   - Dampers over 1.0m²: 7x7 grid (49 readings)
4. **Enter your readings** - Tap each cell in the grid and enter your anemometer reading. Use keyboard navigation (Tab or arrow keys) to move quickly between cells.
5. **See instant calculations** - As you enter readings, the average velocity updates in real-time. You'll see:
   - Overall average velocity (m/s)
   - Minimum and maximum readings
   - Calculated airflow volume (m³/s)

**What you'll see on screen:**
- A visual grid matching the damper face
- Each cell showing its reading value
- Colour coding: green for readings within tolerance, amber for borderline, red for out of spec
- The calculated average prominently displayed
- Pass/fail status against the design velocity

**Real-world example:** You're commissioning a smoke shaft serving floors 1-10 of a new residential tower. Each floor has a 750mm x 500mm motorised damper. You set up the test, enter the dimensions, and the app creates a 6x6 grid. You take your 36 readings across the damper face using your anemometer, entering each value. The app shows an average of 8.2 m/s against a design requirement of 8.0 m/s - a clear pass.

**System types supported:**
- **Push systems** - Supply air into protected areas
- **Pull systems** - Extract smoke from affected areas  
- **Push-pull systems** - Combined supply and extract

**Visit types you can record:**
- Initial commissioning (new installation)
- Annual inspection (maintenance contract)
- Remedial works (after repairs)
- Final verification (sign-off testing)

---

### Stairwell Differential Pressure Testing

**What it does:** Measures and documents pressure differentials in pressurised stairwells to verify they meet building standards for escape route protection.

**How to use it:**

1. **Select your building standard** - Choose from:
   - BS EN 12101-6:2022 (current standard)
   - BS EN 12101-6:2005 (legacy installations)
   - BS 5588-4:1998 (older buildings)

2. **Choose the pressure class** - Options range from Class A to Class F, each with different pressure requirements:
   - Class A: 50 Pa (±10%)
   - Class B: 45 Pa (±10%)
   - And so on...

3. **Add floors to test** - List each floor in the stairwell (Ground, 1, 2, 3... up to the roof level)

4. **Record measurements for each scenario:**

   **Doors Closed Test:**
   - Enter the pressure differential (Pa) across the stairwell door at each level
   - The app shows whether each reading is within the acceptable range
   
   **Single Door Open Test:**
   - Open one door at a time and measure the minimum pressure at other levels
   - Records which door was opened and resulting pressures
   
   **Door Force Test:**
   - Measure the force (Newtons) required to open each door
   - App checks against 100N limit (or 140N for fire doors)
   - Flags any doors exceeding the maximum opening force

**What you'll see on screen:**
- A floor-by-floor table of all readings
- Green/red indicators for pass/fail at each level
- Automatic calculation of average pressures
- Door force compliance status
- Overall system pass/fail summary

**Real-world example:** You're conducting an annual inspection of a 15-storey pressurised stairwell. You select BS EN 12101-6:2022, Class B. Starting at ground level, you work your way up, recording the pressure at each floor with all doors closed (target: 45 Pa ±10%). You then repeat with the ground floor door open, then first floor door open, and so on. Finally, you measure door opening forces. The app compiles all results and shows 2 floors failing the single-door-open test - you know exactly where remedial work is needed.

---

### Test Scenarios Supported

The app handles various testing configurations:

- **All doors closed** - Standard operating condition testing
- **Single door open** - Tests pressure maintenance when occupants use the stairwell
- **Multiple doors open** - Simulates evacuation conditions
- **Fire service override** - Tests firefighter switch operation and bypass modes

---

## Compliance & Reporting

### UK Building Standards Reference

The app includes built-in reference to key standards:

| Standard | Description | When to use |
|----------|-------------|-------------|
| BS EN 12101-8:2020 | Smoke control dampers | All damper testing |
| BS EN 12101-6:2022 | Stairwell pressurisation | Current installations |
| BS 5588-4:1998 | Smoke control in escape routes | Older buildings |
| BSRIA BG 49/2024 | Commissioning air systems | All commissioning work |

**What you'll see:** When you select a standard, the app automatically applies the correct:
- Measurement grid requirements
- Pressure tolerances
- Door force limits
- Commissioning checklist items

---

### Professional PDF Reports

**What it does:** Generates polished, client-ready reports that you can email or print directly from the app.

**How to use it:**

1. **Complete your testing** - All readings must be entered
2. **Add project details** - Client name, site address, your engineer details
3. **Capture signatures** - Both tester and witness signatures using touch screen
4. **Tap "Generate Report"** - The PDF is created in seconds

**What you'll see in the report:**
- Your company logo and branding (upload once, used on all reports)
- Executive summary with pass/fail status
- Complete test data with the measurement grid
- Visual representation of readings
- Compliance checklist with tick marks
- Digital signatures
- Report reference number and date
- Standard references

**Report types available:**
- Commissioning certificate (new installations)
- Annual inspection report (maintenance visits)
- Remedial works report (after repairs)
- Summary report (quick overview)

**Real-world example:** After completing damper testing across a 6-floor office building (12 dampers total), you tap "Generate Report". In 10 seconds, you have a 25-page PDF with all test data, a summary showing 11 pass and 1 fail, photographs of the failed damper, and both signatures. You email it to the client before leaving site.

---

### Compliance Checklists

**What it does:** Provides structured checklists aligned to UK standards to ensure nothing is missed during testing.

**How to use it:**

1. **Select the checklist type** - Choose from pre-test, functional, performance, or documentation checklists
2. **Work through each item** - Tick off items as you verify them
3. **Add notes** - Record observations against specific items
4. **Mark completion** - The checklist becomes part of your test record

**Checklist categories:**

**Pre-Test Verification:**
- [ ] Damper accessible for testing
- [ ] Control panel in manual mode
- [ ] Building HVAC system status confirmed
- [ ] Test equipment calibrated (date checked)
- [ ] Site access arrangements in place

**Functional Testing:**
- [ ] Damper opens on command
- [ ] Damper closes on command
- [ ] End switches operate correctly
- [ ] Manual release functions
- [ ] Position indicators accurate

**Performance Testing:**
- [ ] Design airflow rate documented
- [ ] Measurement grid completed
- [ ] Average velocity calculated
- [ ] Leakage rate within tolerance
- [ ] System response time acceptable

**Documentation:**
- [ ] As-built drawings available
- [ ] O&M manual present
- [ ] Previous test results reviewed
- [ ] Calibration certificates checked

---

### Golden Thread Document Management

**What it does:** Supports Building Safety Act compliance by maintaining a structured audit trail of all testing documentation.

**How to use it:**

1. **Upload existing documents** - Add as-built drawings, O&M manuals, previous reports
2. **Link to tests** - Connect documents to specific dampers or projects
3. **Track versions** - When documents are updated, the history is preserved
4. **View audit trail** - See who uploaded/modified what and when

**What you'll see:**
- Document library organised by building and system
- Version numbers on each document
- Upload dates and user names
- Links to related test records
- Export capability for handover packs

**Why this matters:** The Building Safety Act requires a "golden thread" of building safety information. This feature ensures your testing records are part of that thread, properly linked to the building's safety case documentation.

---

## Business Management Platform (CRM)

### Client Management

**What it does:** Maintains a complete database of all your clients with their contact details, sites, and preferences.

**How to use it:**

1. **Add a new client** - Tap "New Client" and enter:
   - Company name (e.g., "Jones Property Management Ltd")
   - Primary contact person and their role
   - Phone numbers (office and mobile)
   - Email addresses
   - Company address

2. **Add multiple contacts** - Each client can have several contacts:
   - Building manager: Sarah Thompson, sarah@jonesproperty.com
   - Accounts: accounts@jonesproperty.com
   - Emergency out-of-hours: 07xxx xxxxxx

3. **Add multiple addresses** - Useful for clients with several sites:
   - Head Office: 45 High Street, Manchester M1 1AA
   - London Office: 22 Fleet Street, London EC4Y 1AA
   - Birmingham Site: Unit 4, Industrial Estate, B1 2CD

4. **Set client priority** - Helps you prioritise:
   - Standard: Normal service levels
   - Preferred: Priority scheduling
   - VIP: Immediate response

5. **Record financial details**:
   - VAT number
   - Account reference
   - Payment terms (30 days, 60 days, etc.)

**What you'll see on the client screen:**
- Client summary card with key details
- List of all contacts with click-to-call/email
- All associated addresses on a map
- Contract summary (active contracts, value)
- Job history
- Outstanding invoices
- Notes and activity log

**Real-world example:** You receive a call from "Green Facilities Ltd". You search for them, see they're a VIP client with 3 active contracts worth £45,000/year. You can see their 5 sites on a map, their preferred engineer is Dave (who knows their systems), and they have one overdue invoice. You have everything you need to handle the call professionally.

---

### Contract Management

**What it does:** Tracks all your service agreements, their value, renewal dates, and SLA requirements.

**How to use it:**

1. **Create a new contract** - Enter:
   - Contract name (e.g., "Annual Smoke Vent Maintenance - Tower Court")
   - Client (select from your list)
   - Start date and end date
   - Contract value (e.g., £3,500 per year)
   - Billing frequency (monthly, quarterly, annually)
   - Auto-renewal: Yes/No

2. **Set SLA levels**:
   - Basic: 5-day response, 10-day resolution
   - Standard: 2-day response, 5-day resolution
   - Premium: Same-day response, 2-day resolution

3. **Add covered sites** - List which addresses are included

4. **Define scope** - What's included:
   - Number of dampers covered
   - Annual tests included
   - Emergency callouts (included/chargeable)
   - Parts (included/chargeable)

**What you'll see:**
- Contract dashboard showing all active contracts
- Upcoming renewals (next 30, 60, 90 days)
- Contract value totals
- SLA performance metrics
- Linked jobs and invoices

**Real-world example:** It's October and you want to see which contracts renew in January. You filter by renewal date and see 8 contracts worth £28,000 are due for renewal. You can generate renewal letters directly, see the service history for each, and plan your retention calls.

---

### Job Scheduling

**What it does:** Creates and tracks work orders from initial request through to completion and invoicing.

**How to use it:**

1. **Create a new job**:
   - Job type: Testing / Installation / Repair / Maintenance
   - Client: Select from list
   - Site address: Select from client's addresses
   - Description: "Annual smoke damper testing - 12 dampers across 6 floors"
   - Priority: Low / Normal / High / Urgent

2. **Schedule the job**:
   - Planned date: Pick from calendar
   - Estimated duration: 4 hours
   - Assigned engineer: Select from staff list

3. **Add site access notes**:
   - "Report to main reception, ask for security"
   - "Parking in loading bay, need permit from security"
   - "Out of hours access: call 07xxx before arrival"

4. **Track progress** - Job statuses:
   - Pending: Created but not scheduled
   - Scheduled: Date and engineer assigned
   - In Progress: Engineer has started work
   - Completed: Work finished
   - Invoiced: Invoice sent to client
   - Cancelled: Job cancelled (with reason)

**What you'll see:**
- Job board showing all jobs by status
- Calendar view of scheduled work
- Engineer diary view
- Job details with all notes and history
- Linked test records
- Time and materials logged

**Real-world example:** A client calls with an urgent fault - one damper failed to open during a fire alarm test. You create an Urgent job, see that Dave is free tomorrow morning, assign it to him. Dave gets a notification on his phone with all the site details. He arrives, fixes the issue, marks the job complete, and logs 2 hours labour plus a new actuator. You invoice the same day.

---

### Quotes & Invoices

**What it does:** Creates professional quotes and invoices linked to your jobs and contracts.

**How to create a quote:**

1. **Start a new quote**:
   - Select client
   - Enter quote description
   - Add line items:
     - "Annual smoke damper testing (12 dampers)" - £1,800.00
     - "Fire stopping inspection" - £350.00
     - "Report production and handover" - £150.00
   - Subtotal, VAT, and total calculate automatically

2. **Send to client** - Generate PDF and email directly

3. **Convert to invoice** - When accepted, one tap converts the quote to an invoice

4. **Track payment**:
   - Mark as sent
   - Record payment received
   - Chase overdue invoices

**What you'll see:**
- Quote/invoice list with status (Draft, Sent, Accepted, Paid, Overdue)
- Outstanding amounts
- Payment history
- Aged debtor reports

---

### Financial Tracking

**What it does:** Records all costs associated with jobs so you can see true profitability.

**How to record expenses:**

1. **Add an expense**:
   - Date
   - Category: Materials / Travel / Subcontractor / Equipment / Other
   - Description: "Replacement actuator for Tower Court"
   - Amount: £245.00
   - Receipt: Capture photo of receipt

2. **Record mileage**:
   - Start location
   - End location
   - Miles travelled
   - Rate (e.g., 45p/mile)
   - Auto-calculates value

3. **Log time**:
   - Job reference
   - Hours worked
   - Engineer
   - Activity type (travel, testing, paperwork)

**What you'll see:**
- Expense reports by category
- Mileage summaries
- Job costing: revenue vs expenses = profit
- Margin calculations per job
- Monthly financial summaries

**Real-world example:** You complete a job invoiced at £2,400. Looking at the job costing:
- Labour (8 hours × £45): £360
- Materials: £245
- Travel (85 miles): £38
- Total costs: £643
- Profit: £1,757 (73% margin)

---

## Staff & Resource Management

### Staff Directory

**What it does:** Maintains complete records for all your employees and contractors.

**Information stored for each person:**
- Full name and job title
- Contact details (phone, email, address)
- Employment type: Full-time / Part-time / Contractor / Apprentice
- Start date
- Line manager
- Emergency contact
- National Insurance number
- Driving licence details (including expiry date)

**What you'll see:**
- Staff list with quick search
- Individual profile cards
- Organisation chart
- Upcoming driving licence renewals
- Employment anniversary dates

---

### Skills & Qualifications

**What it does:** Tracks all certifications, training, and competencies for each team member.

**How to use it:**

1. **Add qualifications**:
   - Type: CSCS Card / NVQ / Manufacturer Training / In-house
   - Name: "Fire Door Inspection - FDIS Level 1"
   - Issue date
   - Expiry date
   - Certification number
   - Upload certificate image

2. **Record skills**:
   - Skill name: "Smoke Damper Testing"
   - Competency level: Trainee / Competent / Specialist / Trainer
   - Date assessed

3. **Set up alerts** - Get notified before certifications expire

**What you'll see:**
- Skills matrix across the team
- Who is qualified for what
- Upcoming certificate renewals
- Training needs identification
- Competency gaps

**Real-world example:** A client specifically requests a BSRIA-trained engineer. You search by qualification and see Dave and Maria both hold BSRIA CP/47 certification. Maria's is due to expire next month - you make a note to book her refresher course.

**Sample engineers in the demo data:**

| Name | Level | Key Skills |
|------|-------|------------|
| David Thompson | Senior | Smoke dampers, Stairwell pressurisation, BSRIA CP/47 |
| Sarah Mitchell | Competent | Damper testing, AOV servicing |
| James Wilson | Trainee | Under supervision, learning damper testing |
| Michael Brown | Specialist | Complex commissioning, training delivery |
| Emma Davis | Competent | Testing, inspection |
| Robert Taylor | Senior | Pressure systems, commissioning |
| Lisa Anderson | Trainee | Basic testing under supervision |
| Chris Martin | Specialist | System design, witness testing |

---

### Staff Scheduling

**What it does:** Manages availability, time-off, and shift patterns.

**Features:**
- Availability patterns (Mon-Fri 8am-5pm, etc.)
- Time-off requests and approvals
- Shift handover notes
- Daily briefing distribution

---

### Equipment & Vehicles

**What it does:** Tracks all your test equipment and company vehicles.

**For equipment:**
- Asset register with descriptions
- Serial numbers
- Calibration status and due dates
- Current location/custodian
- Service history
- Reservation for specific jobs

**For vehicles:**
- Fleet list
- MOT and service due dates
- Mileage tracking
- Driver assignments
- Booking calendar

**Real-world example:** You need to send an engineer to a job requiring a calibrated anemometer. You check equipment availability - see that anemometer #3 is calibrated until March and currently with Dave (who has a job nearby). You can reassign it to Maria's job next week.

---

## Intelligent Features

### Trend Analysis

**What it does:** Charts historical velocity data so you can spot declining performance over time.

**How to use it:**

1. **Select a damper** - Choose from your damper registry
2. **View history** - See all tests performed on that damper
3. **See the trend chart** - X-axis shows dates, Y-axis shows average velocities

**What you'll see:**
- Line chart showing velocity over time
- Design velocity baseline for comparison
- Trend line (is it declining?)
- Anomaly markers (unusual readings highlighted)
- Comparison with similar dampers

**Why this matters:** If a damper tested at 8.5 m/s last year now tests at 7.2 m/s, that's a 15% decline. The trend chart makes this immediately visible. You can recommend preventive maintenance before it fails completely.

---

### Anomaly Detection

**What it does:** Automatically flags readings that are statistically unusual.

**How it works:**
- Uses MAD (Median Absolute Deviation) algorithm
- Compares each reading against historical patterns
- Flags readings more than 2 standard deviations from normal

**What you'll see:**
- Unusual readings highlighted in orange/red
- Explanation of why it's flagged
- Comparison to historical average
- Suggested action (investigate, retest, service required)

**Real-world example:** You enter readings for a damper. Most cells show 7-8 m/s, but one shows 3.2 m/s. The app immediately highlights this reading with an alert: "This reading is 58% below the damper average. Check for obstruction or damage in this quadrant."

---

### Predictive Maintenance

**What it does:** Uses historical data to predict when maintenance will be needed.

**Features:**
- Velocity decline rate calculation
- Time to reach minimum acceptable velocity
- Maintenance scheduling recommendations
- Pre-loaded predictive readings based on history

**What you'll see:**
- Predicted test results before you start (based on trend)
- Expected maintenance date
- Recommended service items
- Comparison of actual vs predicted

**Real-world example:** The app shows a damper has declined 5% per year over the last 3 tests. At this rate, it will drop below the minimum 6.5 m/s requirement in approximately 18 months. You can schedule preventive maintenance now rather than waiting for failure.

---

## Project & Site Management

### Projects

**What it does:** Groups related buildings and dampers together for efficient management.

**How to use it:**

1. **Create a project**:
   - Project name: "Tower Court Residential Development"
   - Client: Select from list
   - Site address
   - Main contractor (if applicable)
   - Project status: Planning / Active / Complete / On Hold

2. **Add buildings**:
   - Building A: 15-storey residential
   - Building B: 12-storey residential
   - Podium: 2-storey retail

3. **Add dampers to each building** - See Damper Registry below

**What you'll see:**
- Project overview dashboard
- Building list with damper counts
- Testing progress (12 of 45 dampers tested)
- Linked contracts and jobs
- Document library

---

### Damper Registry

**What it does:** Maintains a complete database of every damper you manage.

**Information stored for each damper:**
- Unique damper ID (e.g., "TC-A-L05-SD01")
- Building and location (Tower Court, Building A, Level 05)
- Shaft identifier (Smoke Shaft 1)
- Dimensions (600mm × 400mm)
- System type (Push/Pull/Push-Pull)
- Manufacturer and model
- Installation date
- All historical test records

**What you'll see:**
- Searchable damper list
- Filter by building, floor, system type
- Test status (never tested, passed, failed, due soon)
- Quick access to test history
- Photo gallery

**Damper ID naming convention:**
The app suggests a standardised format:
`[Building]-[Floor]-[Type]-[Number]`
Example: TC-A-L05-SD01 = Tower Court, Building A, Level 05, Smoke Damper 01

---

### Damper Templates

**What it does:** Saves commonly-used damper configurations for quick reuse.

**How to use it:**

1. **Create a template**:
   - Template name: "Standard AOV 600x400 Push"
   - Default dimensions
   - Default system type
   - Standard manufacturer

2. **Apply to new dampers** - Select template, adjust only what's different

**Real-world example:** A development has 45 identical dampers. You create a template with the standard settings, then apply it to each damper, only changing the floor and location identifier. Saves significant time versus entering all details manually 45 times.

---

### Floor Sequencing Mode

**What it does:** Provides structured floor-by-floor testing to ensure nothing is missed.

**How to use it:**

1. **Start floor sequence** - Select the building
2. **Work through floors** - App presents dampers floor by floor
3. **Mark completion** - Each floor shows complete/incomplete status
4. **Track progress** - Visual indicator of progress through building

**What you'll see:**
- Floor-by-floor list
- Number of dampers per floor
- Completion status
- Time spent per floor
- Estimated time remaining

---

## Data Management

### Export Options

**PDF Reports:**
- Professional client-ready documents
- Company branding
- Digital signatures
- Pass/fail summaries

**CSV Export:**
- Raw data for spreadsheet analysis
- All readings in tabular format
- Suitable for client data systems

**JSON Backup:**
- Complete data export
- Suitable for backup and restore
- Can transfer to another device

**ZIP Archives:**
- Bundle multiple reports
- Include photos and documents
- Complete project handover package

---

### Offline Capability

**What it does:** Works fully without internet connection - essential for basement and core testing where signal is poor.

**How it works:**
- All data stored locally on device
- Create and complete tests offline
- Offline indicator shows when disconnected
- Changes queued for sync when back online
- Automatic sync when connection restored

**What you'll see:**
- Connectivity indicator in header
- Pending sync count (e.g., "3 changes waiting to sync")
- Sync status animation when connecting
- Confirmation when sync complete

**Real-world example:** You're testing dampers in a basement car park with no signal. You complete 6 damper tests over 2 hours. When you return to the surface and get signal, the app automatically syncs all 6 tests to the server within seconds.

---

### Auto-Save

**What it does:** Continuously saves your work so you never lose data.

**What you'll see:**
- Save indicator: "Saved" with timestamp
- Auto-saves every few seconds during data entry
- Confirmation when manually saving
- Recovery of unsaved work if app closes unexpectedly

---

## User Experience

### Touch-Optimised Interface

**Designed for field use:**
- Large tap targets (no tiny buttons)
- Works with gloves
- Works in bright sunlight
- Minimal scrolling required
- Key actions always visible

---

### Navigation

**Keyboard shortcuts for efficiency:**
- Tab: Move to next cell
- Shift+Tab: Move to previous cell
- Arrow keys: Move within grid
- Enter: Confirm and move down
- Escape: Cancel edit

**Quick navigation:**
- Recent items list
- Search across all data
- Breadcrumb trails showing where you are
- Back button always available

---

### Visual Feedback

**Clear status indicators:**
- Saving: Subtle animation
- Saved: Green checkmark with timestamp
- Offline: Orange indicator
- Error: Red alert with explanation
- Success: Green toast notification

---

### Image Documentation

**What it does:** Captures photos of dampers and attaches them to test records.

**How to use it:**

1. **Tap camera icon** on damper or test
2. **Capture photo** - Shows preview
3. **Annotate** - Draw on image to highlight issues
4. **Save** - Attached to record

**Photo types:**
- Damper in open position
- Damper in closed position
- Defects or damage
- Location/identification plate
- General installation views

---

## Mobile App Features (Capacitor)

### Native Functionality

The mobile app provides:
- **iOS and Android versions** - Install from app stores
- **Camera integration** - Native camera for quality photos
- **Splash screen** - Professional branding on launch
- **Status bar** - Customised to match app design

### Offline-First Design

- Full functionality without internet
- Local data persistence
- Background sync when online
- Battery optimised

---

## Security & Authentication

### User Management

**Login options:**
- Replit Auth (quick social login)
- Username/password (traditional)
- Session management (stay logged in)

### Data Isolation

- Each user sees only their own data
- Shared demo data for training new users
- Role-based access ready for team implementation

---

## Sample Data (Pre-loaded)

The app comes pre-loaded with realistic UK demo data to explore:

**8 Staff Members:**
- Mix of experience levels (Trainee to Specialist)
- Various qualifications (CSCS, NVQ, BSRIA)
- Complete profile information

**6 Client Companies:**
- Spread across UK regions
- Different sectors (commercial, residential, public)
- Multiple contacts and addresses

**9 Service Contracts:**
- Various values and terms
- Different SLA levels
- Renewal dates spread throughout year

**6 Building Projects:**
- Different sizes and types
- Multiple dampers per building
- Complete test histories

**18 Jobs:**
- Various statuses (pending to completed)
- Different types (testing, maintenance, repair)
- Assigned to different engineers

**Dampers and Test Records:**
- Multiple damper configurations
- Historical velocity readings
- Trend data for analysis demos

---

## Getting Started

1. **Log in** using your preferred method
2. **Explore the demo data** - All features have sample data to try
3. **Create your first client** - Start building your own database
4. **Add a project and dampers** - Set up your first site
5. **Run a test** - Experience the touch-optimised testing workflow
6. **Generate a report** - See the professional PDF output

---

## Technical Stack

For developers and technical teams:

- **Frontend**: React 18+, TypeScript, Vite, shadcn/ui, Tailwind CSS
- **Backend**: Express.js, TypeScript, RESTful API
- **Database**: PostgreSQL with Drizzle ORM
- **Mobile**: Capacitor for iOS/Android
- **Charts**: Recharts
- **PDF**: jsPDF, html-to-image
- **Forms**: React Hook Form, Zod validation
