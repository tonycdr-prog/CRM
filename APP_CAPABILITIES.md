# Life Safety Ops
## Life Safety Operations & Compliance Management Platform
### Complete Operations Guide & How-To Manual

**Version 1.0 | December 2024**

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [Getting Started](#getting-started)
3. [Dashboard & Navigation](#dashboard--navigation)
4. [Office Application](#office-application)
   - [Client Management](#client-management)
   - [Site Management](#site-management)
   - [Contract Management](#contract-management)
   - [Job Management](#job-management)
   - [Finance & Invoicing](#finance--invoicing)
   - [Asset & Equipment Management](#asset--equipment-management)
   - [Team & Certification Management](#team--certification-management)
   - [Reporting & Analytics](#reporting--analytics)
5. [Field Companion Application](#field-companion-application)
   - [Mobile Interface Overview](#mobile-interface-overview)
   - [Smoke Control Damper Testing](#smoke-control-damper-testing)
   - [Stairwell Pressure Testing](#stairwell-pressure-testing)
   - [Offline Synchronisation](#offline-synchronisation)
   - [Job Execution & Updates](#job-execution--updates)
   - [Defect Logging & Risk Assessments](#defect-logging--risk-assessments)
6. [Compliance & Regulations](#compliance--regulations)
   - [BS EN 12101 Standards](#bs-en-12101-standards)
   - [Building Safety Act Compliance](#building-safety-act-compliance)
   - [Golden Thread Documentation](#golden-thread-documentation)
   - [Professional PDF Reports](#professional-pdf-reports)
7. [Organisation Management](#organisation-management)
8. [Appendices](#appendices)

---

## Executive Overview

Life Safety Ops is a comprehensive life safety operations and compliance management platform designed specifically for UK fire safety professionals. The platform provides a complete solution for managing smoke control system testing, compliance documentation, and business operations.

### Who Is This For?

- **Fire Safety Contractors**: Companies providing smoke control maintenance and testing services
- **Commissioning Engineers**: Professionals commissioning new smoke control installations
- **Building Services Consultants**: Consultancies advising on fire safety compliance
- **Smoke Ventilation Specialists**: Technicians maintaining smoke exhaust and pressurisation systems
- **Property Management Companies**: Organisations responsible for building safety compliance

### Key Features

| Feature | Description |
|---------|-------------|
| **Dual-Mode Interface** | Seamlessly switch between Office mode for administrative tasks and Engineer mode for field work |
| **Regulatory Compliance** | Full support for BS EN 12101-8, BSRIA BG 49/2024, and Building Safety Act requirements |
| **Automatic Calculations** | Grid size determination (5×5, 6×6, or 7×7) based on damper dimensions |
| **Professional Reporting** | Generate QR-verified PDF certificates with full compliance documentation |
| **Offline Capability** | Complete field testing functionality without internet connectivity |
| **Business Management** | Integrated CRM, invoicing, scheduling, and asset tracking |
| **Multi-Tenant Support** | Organisations can manage multiple team members with role-based access |
| **Golden Thread** | Building Safety Act compliant document management and audit trails |

### Platform Architecture

The platform consists of two primary modes:

**1. Office Mode**
Full CRM functionality with sidebar navigation for managing:
- Clients and contacts
- Contracts and service agreements
- Job scheduling and tracking
- Quotes, invoices, and expenses
- Asset and equipment registers
- Team members and certifications
- Reports and analytics
- Golden Thread documentation

**2. Engineer Mode (Field Companion)**
Mobile-first interface optimised for on-site work:
- Touch-friendly controls for field use
- Offline testing capability
- Job execution and status updates
- Photo documentation and annotation
- Signature capture
- Defect logging
- Time tracking

---

## Getting Started

### System Requirements

**Web Application**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for initial login
- Desktop or tablet screen recommended for Office mode

**Mobile Application (Field Companion)**
- iOS 14+ or Android 10+
- Internet connection for synchronisation
- Works offline for field testing

### Logging In

1. Navigate to the Life Safety Ops website
2. Click **Log In** or **Get Started**
3. Authenticate using your Replit account credentials
4. Upon first login, you will be prompted to create or join an organisation

**Screenshot: Login Screen**
The login screen displays the Life Safety Ops branding with options to sign in or create an account.

### Creating an Organisation

If you are the first user from your company:

1. Navigate to **Settings** from the sidebar footer (click the cog icon)
2. Select the **Organisation** tab
3. Enter your company name (e.g., "SafeVent Solutions Ltd")
4. Click **Create Organisation**
5. You will automatically be assigned the **Owner** role

**Screenshot: Organisation Creation**
The Settings page showing the Organisation tab with fields for company name and create button.

### Inviting Team Members

Owners and Administrators can invite team members:

1. Go to **Settings** → **Team** tab
2. Click **Invite Member**
3. Enter the email address of the person you wish to invite
4. Select their role from the dropdown:
   - **Admin**: Full management access
   - **Office Staff**: CRM access, scheduling, invoicing
   - **Engineer**: Field work, test data, job updates
   - **Viewer**: Read-only access
5. Click **Send Invitation**
6. Share the invitation link with your colleague
7. The invitation expires after 7 days

**Screenshot: Team Invitations**
The Team tab showing current members, pending invitations, and the invitation dialog.

### Accepting an Invitation

1. Click the invitation link received via email or from your colleague
2. Log in or create a Replit account if needed
3. You will be automatically added to the organisation with the assigned role
4. Access the platform immediately

### Switching Between Modes

Use the toggle switch in the header to switch between:
- **Office Mode**: Full desktop interface with sidebar navigation
- **Engineer Mode**: Mobile-optimised Field Companion interface

The mode preference is saved and persists across sessions. Engineers default to Field Companion mode, while office staff default to Office mode.

**Screenshot: Mode Toggle**
Header bar showing the toggle switch between Office and Engineer modes.

---

## Dashboard & Navigation

### Office Dashboard

The dashboard provides an at-a-glance overview of your operations:

**Key Metrics Cards**
- **Active Jobs**: Number of jobs currently in progress
- **Pending Jobs**: Jobs awaiting scheduling or assignment
- **Due This Week**: Upcoming scheduled work
- **Overdue Items**: Jobs or invoices requiring attention

**Quick Actions Panel**
- Create New Job
- Create New Quote
- Add New Client
- Schedule Visit

**Recent Activity Feed**
- Latest job updates
- New client additions
- Invoice payments received
- Test completions

**Upcoming Schedule**
- Today's appointments
- This week's jobs
- Calendar integration

**Screenshot: Dashboard Overview**
The main dashboard showing all key metrics, quick actions, recent activity, and upcoming schedule in a clean grid layout.

### Navigation Structure

The sidebar organises features into logical groups. Click on a section header to expand it and reveal sub-pages.

**Testing & Field Work**
| Page | Description |
|------|-------------|
| Dashboard | Overview and quick actions |
| Field Testing | Damper and stairwell testing interface |
| Check Sheet Readings | Form-based data capture |

**CRM & Clients**
| Page | Description |
|------|-------------|
| Clients | Client company records |
| Sites | Physical locations and buildings |
| Contracts | Service agreements and SLAs |
| Jobs | Work orders and appointments |
| Schedule | Calendar view of all work |

**Finance**
| Page | Description |
|------|-------------|
| Finance Overview | Summary of quotes, invoices, expenses |
| Quotes | Estimates and proposals |
| Invoices | Billing and payments |
| Expenses | Cost tracking and reimbursements |
| Timesheets | Time recording and payroll data |

**Operations**
| Page | Description |
|------|-------------|
| Vehicles | Fleet management |
| Subcontractors | Third-party supplier management |
| Holidays | Staff leave management |
| Mileage Claims | Travel expense recording |
| Work Notes | General operational notes |
| Callbacks | Follow-up task tracking |

**Asset Management**
| Page | Description |
|------|-------------|
| Site Assets | Assets at customer sites (dampers, AOVs) |
| Equipment | Company-owned tools and instruments |
| Inventory | Stock and consumables |
| Suppliers | Vendor contacts and details |
| Purchase Orders | Procurement management |

**HR & Training**
| Page | Description |
|------|-------------|
| Staff Directory | Team member profiles |
| Training Records | CPD and course tracking |
| Certifications | Qualification management |
| Time Off Requests | Leave approval workflow |

**Sales & Pipeline**
| Page | Description |
|------|-------------|
| Leads | Prospective clients |
| Tenders | Bid management |
| Competitors | Market intelligence |

**Compliance & Safety**
| Page | Description |
|------|-------------|
| Golden Thread | Building Safety Act documentation |
| Incidents | Safety incident reporting |
| Risk Assessments | Site risk documentation |
| Defect Register | Outstanding defects tracking |

**Documents & Reports**
| Page | Description |
|------|-------------|
| Document Register | Centralised document library |
| Document Templates | Reusable templates |
| Reports | Analytical reports |
| Service Analytics | Performance dashboards |
| Engineer Performance | Staff productivity metrics |
| Site Health | Asset condition overview |
| Downloads | PDF exports and guides |
| Notifications | System alerts and messages |

**Screenshot: Sidebar Navigation**
The collapsed and expanded sidebar showing all navigation sections with icons.

---

## Office Application

### Client Management

#### Creating a New Client

1. Navigate to **CRM & Clients** → **Clients**
2. Click the **Add Client** button (top right)
3. Complete the client details form:

**Basic Information**
- **Company Name**: Full legal name (e.g., "Tower Properties Ltd")
- **Trading Name**: If different from legal name
- **Account Reference**: Your internal reference code
- **Client Type**: Commercial / Residential / Mixed-Use

**Contact Information**
- **Primary Email**: Main contact email
- **Phone Number**: Office telephone
- **Website**: Company website URL

**Address**
- **Address Line 1**: Street address
- **Address Line 2**: Building/Suite (optional)
- **City**: Town or city
- **Postcode**: UK postcode
- **Country**: Default UK

**Account Settings**
- **Payment Terms**: 14 days / 30 days / 60 days
- **VAT Number**: If VAT registered
- **Priority Level**: Standard / Preferred / VIP
- **Account Manager**: Assigned staff member

4. Click **Save** to create the client record

**Screenshot: New Client Form**
The client creation form showing all fields organised in logical sections.

#### Managing Client Contacts

Each client can have multiple contacts with different roles:

1. Open the client record by clicking on their name
2. Scroll to the **Contacts** section
3. Click **Add Contact**
4. Enter contact details:
   - **Full Name**: First and last name
   - **Job Title**: Their role (e.g., "Building Manager")
   - **Email**: Individual email address
   - **Phone**: Direct dial or mobile
   - **Mobile**: Mobile number
   - **Is Primary**: Toggle if main contact
   - **Notes**: Any relevant notes
5. Click **Save**

**Example Contact List**:
| Name | Role | Email | Primary |
|------|------|-------|---------|
| Sarah Thompson | Building Manager | sarah@towerprop.com | Yes |
| Michael Chen | Facilities Coordinator | m.chen@towerprop.com | No |
| Accounts Team | Accounts Payable | accounts@towerprop.com | No |

**Screenshot: Client Contacts**
The contacts section within a client record showing the list and add contact dialog.

#### Client Addresses

Clients may have multiple site addresses:

1. Within the client record, find **Addresses**
2. Click **Add Address**
3. Enter address details:
   - **Address Type**: Registered / Billing / Site
   - **Address Name**: Friendly name (e.g., "Head Office")
   - **Full Address**: Complete postal address
   - **Postcode**: UK postcode
   - **Access Notes**: Parking, entry codes, etc.
4. Click **Save**

**Screenshot: Client Addresses**
The addresses section showing multiple locations on a map with details panel.

### Site Management

Sites are physical locations where testing and services are performed. Sites link to clients and contain assets.

#### Creating a Site

1. Navigate to **CRM & Clients** → **Sites**
2. Click **Add Site**
3. Complete the site form:

**Site Information**
- **Site Name**: Descriptive name (e.g., "Tower Court - Block A")
- **Client**: Select from existing clients (dropdown)
- **Site Reference**: Your reference number

**Address Details**
- **Address**: Full postal address
- **Postcode**: UK postcode
- **What3Words**: Location reference (optional)

**Building Information**
- **Building Type**: Residential / Commercial / Industrial / Mixed-Use
- **Number of Floors**: Total floors including basement
- **Year Built**: Original construction year
- **Responsible Person**: Building manager name

**Access Requirements**
- **Access Instructions**: How to enter the building
- **Key Safe Location**: If applicable
- **Parking Information**: Where to park
- **Security Contact**: Phone number

**Emergency Procedures**
- **Assembly Point**: Evacuation meeting point
- **Emergency Contact**: 24/7 contact number
- **Special Hazards**: Any known hazards

4. Click **Save**

**Screenshot: New Site Form**
The site creation form with all sections expanded showing field details.

#### Site Assets

Each site contains assets that require testing and maintenance:

1. Open the site record
2. Navigate to the **Assets** tab
3. Click **Add Asset**
4. Enter asset details:

**Asset Identification**
- **Asset Type**: Smoke Damper / AOV / Pressure System / Fire Curtain
- **Asset Reference**: Your ID code (e.g., "SD-A-01")
- **Manufacturer**: Equipment manufacturer
- **Model Number**: Manufacturer model
- **Serial Number**: Equipment serial

**Location**
- **Floor/Level**: Building floor
- **Zone**: Fire zone designation
- **Location Description**: Specific location (e.g., "Corridor L1, above Room 103")

**Technical Details**
- **Size**: Dimensions (e.g., "600mm x 400mm")
- **System Type**: Push / Pull / Push-Pull / Pressure Differential
- **Design Velocity**: Target airflow (m/s)
- **Design Pressure**: Target pressure (Pa) for pressure systems

**Maintenance Schedule**
- **Testing Frequency**: Weekly / Monthly / Quarterly / Annual
- **Last Test Date**: Most recent test
- **Next Due Date**: Calculated automatically
- **Warranty Expiry**: End of warranty period

5. Click **Save**

**Screenshot: Site Asset Register**
The asset tab showing a table of all assets at a site with status indicators.

### Contract Management

Contracts define the scope of services provided to clients.

#### Creating a Contract

1. Navigate to **CRM & Clients** → **Contracts**
2. Click **Add Contract**
3. Enter contract details:

**Contract Details**
- **Contract Title**: Descriptive name (e.g., "Annual Smoke Control Maintenance")
- **Contract Number**: Reference number
- **Client**: Select from clients
- **Contract Type**: Maintenance / Reactive / Commissioning / Project

**Dates and Value**
- **Start Date**: Contract commencement
- **End Date**: Contract expiry
- **Auto-Renew**: Toggle for automatic renewal
- **Notice Period**: Days notice to cancel (e.g., 90 days)
- **Contract Value**: Annual or total value
- **Billing Frequency**: Monthly / Quarterly / Annually

**Service Level Agreement**
- **Response Time**: Hours to respond (e.g., 4 hours)
- **Resolution Time**: Hours to resolve (e.g., 24 hours)
- **Priority Level**: Standard / Enhanced / Premium

**Scope of Work**
- **Sites Covered**: Select included sites
- **Services Included**: Testing, maintenance, repairs
- **Exclusions**: What is not covered
- **Additional Terms**: Special conditions

4. Click **Save**

**Screenshot: Contract Form**
The contract creation form showing all fields with sample data.

#### Contract Types

| Type | Description | Typical Duration |
|------|-------------|------------------|
| Annual Maintenance | Scheduled preventive maintenance visits | 1-3 years |
| Reactive | On-demand callout services | Rolling |
| Commissioning | New system installation testing | Project-based |
| Project | One-off testing or remediation | Fixed term |

**Screenshot: Contracts Dashboard**
The contracts overview showing active contracts, upcoming renewals, and key metrics.

### Job Management

Jobs represent individual pieces of work to be completed.

#### Creating a Job

**Method 1: From Jobs Page**
1. Navigate to **CRM & Clients** → **Jobs**
2. Click **Add Job**

**Method 2: From Contract**
1. Open a contract
2. Click **Create Job from Contract**
3. Job is pre-populated with contract details

**Method 3: From Quote (Conversion)**
1. Open an approved quote
2. Click **Convert to Job**
3. Job is created with quote line items

**Job Form Fields**:

**Basic Information**
- **Job Title**: Brief description (e.g., "Annual Damper Testing")
- **Job Number**: Auto-generated or manual
- **Client**: Select client
- **Site**: Select from client's sites
- **Contract**: Link to contract (if applicable)

**Job Details**
- **Job Type**: Testing / Maintenance / Repair / Commissioning / Inspection
- **Priority**: Low / Normal / High / Urgent
- **Estimated Duration**: Hours expected
- **Description**: Detailed scope of work

**Scheduling**
- **Planned Date**: Target completion date
- **Scheduled Date**: Confirmed appointment
- **Time Slot**: Morning / Afternoon / All Day / Specific time
- **Assigned Engineer(s)**: Select from staff

**Site Access**
- **Access Instructions**: How to enter
- **Contact on Site**: Person to meet
- **Contact Phone**: Their number
- **Special Requirements**: Equipment, PPE, etc.

4. Click **Save**

**Screenshot: New Job Form**
The job creation form with all fields and smart defaults.

#### Job Statuses

Jobs progress through defined statuses:

| Status | Meaning | Actions Available |
|--------|---------|-------------------|
| Pending | Created but not scheduled | Schedule, assign, edit |
| Scheduled | Date and engineer assigned | Start, reschedule |
| In Progress | Work underway | Update, complete, pause |
| On Hold | Temporarily paused | Resume, cancel |
| Completed | Work finished | Generate report, invoice |
| Invoiced | Invoice generated | Mark paid |
| Cancelled | Job cancelled | View only |

**Screenshot: Job Board**
The job board showing jobs organised by status in columns with drag-and-drop functionality.

#### Job Templates

Create templates for recurring job types:

1. Navigate to **Operations** → **Job Templates** (or create from any job)
2. Click **Add Template**
3. Define standard job parameters:
   - Template name
   - Default job type
   - Standard description
   - Estimated duration
   - Checklist items
   - Required equipment
4. When creating a new job, select "Use Template"

**Screenshot: Job Templates**
The template library showing available templates with quick-use buttons.

### Finance & Invoicing

#### Creating Quotes

1. Navigate to **Finance** → **Finance Overview**
2. Click **Add Quote** or go to **Finance** → **Quotes**
3. Complete the quote form:

**Quote Details**
- **Client**: Select client
- **Quote Number**: Auto-generated
- **Quote Date**: Date of quote
- **Valid Until**: Expiry date (e.g., 30 days)
- **Reference**: Your reference

**Line Items**
Add one or more line items:
- **Description**: Service or product description
- **Quantity**: Number of units
- **Unit Price**: Price per unit (exc. VAT)
- **VAT Rate**: 20% / 5% / 0% / Exempt
- **Total**: Calculated automatically

**Example Line Items**:
| Description | Qty | Unit Price | VAT | Total |
|-------------|-----|------------|-----|-------|
| Annual smoke damper testing (12 dampers) | 1 | £1,800.00 | 20% | £2,160.00 |
| Travel and access charges | 1 | £85.00 | 20% | £102.00 |
| Report production | 1 | £150.00 | 20% | £180.00 |

**Totals**
- Subtotal: £2,035.00
- VAT: £407.00
- **Total: £2,442.00**

**Terms & Conditions**
- Standard terms (from settings)
- Custom terms for this quote

4. Click **Save as Draft** or **Send to Client**

**Screenshot: Quote Builder**
The quote creation interface with line item entry, calculations, and preview.

#### Converting Quotes to Jobs

1. Open an approved/accepted quote
2. Click **Convert to Job**
3. Review job details (pre-populated from quote)
4. Adjust schedule, assignment as needed
5. Click **Create Job**

The job is linked to the quote for traceability.

**Screenshot: Quote to Job Conversion**
The conversion dialog showing the quote summary and job creation options.

#### Creating Invoices

**Method 1: From Completed Job**
1. Open a completed job
2. Click **Generate Invoice**
3. Invoice is created with job details

**Method 2: From Quote**
1. Open an accepted quote
2. Click **Convert to Invoice**
3. Invoice is created with quote line items

**Method 3: Manual Creation**
1. Navigate to **Finance** → **Invoices**
2. Click **Add Invoice**
3. Complete the invoice form (similar to quotes)

**Invoice Fields**:
- **Invoice Number**: Sequential or custom
- **Invoice Date**: Issue date
- **Due Date**: Payment due date
- **Payment Terms**: Reference to terms
- **Line Items**: Services/products billed
- **Notes**: Additional information
- **Payment Instructions**: Bank details, etc.

4. Click **Save** or **Send to Client**

**Screenshot: Invoice Generation**
The invoice interface showing completed invoice with PDF preview.

#### Expense Tracking

Record business expenses for cost tracking and reimbursement:

1. Navigate to **Finance** → **Expenses**
2. Click **Add Expense**
3. Enter expense details:

**Expense Information**
- **Date**: When expense occurred
- **Category**: Materials / Travel / Subsistence / Equipment / Training / Other
- **Description**: What was purchased
- **Amount**: Total cost
- **VAT**: VAT amount (if claimable)
- **Receipt**: Upload photo or PDF

**Allocation**
- **Job**: Link to job (if job-related)
- **Cost Centre**: Department or project
- **Paid By**: Staff member
- **Reimbursement Status**: Pending / Approved / Paid

4. Click **Save**

**Screenshot: Expense Entry**
The expense form showing fields and receipt upload.

#### Timesheets

Record time worked for billing and payroll:

1. Navigate to **Finance** → **Timesheets**
2. Click **Add Entry**
3. Record time:

**Time Entry Fields**
- **Date**: Work date
- **Job/Activity**: Select job or general activity
- **Start Time**: When work began
- **End Time**: When work finished
- **Break Duration**: Unpaid break time
- **Notes**: What was done

**Entry Types**
- Job Work
- Travel
- Training
- Admin
- Meeting

4. Click **Save**

**Screenshot: Timesheet Entry**
The timesheet interface showing weekly view with entries.

### Asset & Equipment Management

#### Equipment Register

Track company-owned equipment and tools:

1. Navigate to **Asset Management** → **Equipment**
2. Click **Add Equipment**
3. Enter details:

**Equipment Information**
- **Name**: Equipment name (e.g., "TSI VelociCalc Anemometer")
- **Category**: Anemometer / Manometer / Smoke Generator / Hand Tools / PPE
- **Make/Model**: Manufacturer and model
- **Serial Number**: Unique identifier
- **Asset Tag**: Your internal tag

**Acquisition**
- **Purchase Date**: When bought
- **Purchase Cost**: Original price
- **Supplier**: Where purchased
- **Warranty End**: Warranty expiry

**Calibration** (for test equipment)
- **Calibration Required**: Yes / No
- **Last Calibration**: Date last calibrated
- **Calibration Due**: Next due date
- **Calibration Interval**: Months between calibrations
- **Certificate Number**: Latest certificate reference

**Assignment**
- **Current Custodian**: Who has it
- **Location**: Where stored
- **Status**: Available / In Use / Under Repair / Retired

4. Click **Save**

**Screenshot: Equipment Register**
The equipment list showing all items with calibration status indicators.

#### Calibration Tracking

The system alerts you before calibration expires:

- **Green**: Calibration current, more than 30 days until due
- **Amber**: Calibration due within 30 days
- **Red**: Calibration overdue

**Screenshot: Calibration Dashboard**
A dashboard showing equipment calibration status with countdown timers.

#### Inventory Management

Track consumables and stock:

1. Navigate to **Asset Management** → **Inventory**
2. View current stock levels
3. Record stock movements:
   - **Stock In**: Items received
   - **Stock Out**: Items used
   - **Adjustment**: Corrections
4. Set reorder thresholds for alerts
5. Generate stock reports

**Screenshot: Inventory Management**
The inventory list with stock levels and reorder indicators.

#### Supplier Management

Maintain supplier contacts:

1. Navigate to **Asset Management** → **Suppliers**
2. Click **Add Supplier**
3. Enter supplier information:
   - Company name and contact
   - Address and phone
   - Products/services supplied
   - Account number
   - Payment terms
4. Link to purchase orders

**Screenshot: Supplier Directory**
The supplier list with contact details and order history summary.

### Team & Certification Management

#### Staff Directory

View and manage all team members:

1. Navigate to **HR & Training** → **Staff Directory**
2. View staff list with:
   - Name and photo
   - Role and department
   - Contact details
   - Employment status
   - Assigned jobs

3. Click on a team member to view their full profile:
   - Personal details
   - Emergency contact
   - Qualifications and certifications
   - Training history
   - Performance metrics
   - Assigned equipment

**Screenshot: Staff Directory**
The staff grid showing team member cards with key information.

#### Certification Tracking

Track engineer certifications and expiry dates:

1. Navigate to **HR & Training** → **Certifications**
2. Click **Add Certification**
3. Enter certification details:

**Certification Information**
- **Staff Member**: Select person
- **Certificate Type**: CSCS / NVQ / Manufacturer / Industry Body
- **Certificate Name**: Full title (e.g., "BSRIA CP/47 Smoke Control Commissioning")
- **Issuing Body**: Organisation that issued it
- **Certificate Number**: Reference number

**Dates**
- **Issue Date**: When obtained
- **Expiry Date**: When it expires
- **Renewal Period**: Months/years

**Documentation**
- **Upload Certificate**: PDF or image of certificate

4. Click **Save**

**Expiry Alerts**:
- 90 days before: Notification to staff member
- 60 days before: Notification to manager
- 30 days before: Urgent alert
- Expired: Cannot be assigned to jobs requiring this certification

**Screenshot: Certification Tracking**
The certification matrix showing all staff with their qualifications and expiry dates.

#### Training Records

Log training completed:

1. Navigate to **HR & Training** → **Training Records**
2. Click **Add Training**
3. Enter details:
   - Training title
   - Provider/trainer
   - Date completed
   - Duration (hours)
   - CPD points earned
   - Certificate uploaded
4. Track CPD requirements

**Screenshot: Training Records**
The training log for an individual showing completed courses.

### Reporting & Analytics

#### Service Analytics

Navigate to **Documents & Reports** → **Service Analytics** to view:

**Key Performance Indicators**
- Jobs completed this month/quarter/year
- Revenue by service type
- Average job value
- First-time fix rate
- Response times vs SLA

**Trend Charts**
- Monthly job volumes
- Revenue trends
- Seasonal patterns
- Year-on-year comparison

**Breakdown Reports**
- Revenue by client
- Jobs by engineer
- Services by type
- Geographic distribution

**Screenshot: Service Analytics Dashboard**
Interactive charts and KPI cards showing operational performance.

#### Engineer Performance

Navigate to **Documents & Reports** → **Engineer Performance** to view:

**Per-Engineer Metrics**
- Jobs completed
- Average completion time
- Customer feedback scores
- Utilisation rate
- Distance travelled
- Revenue generated

**Leaderboards**
- Top performers by month
- Improvement trends
- Certification compliance

**Screenshot: Engineer Performance**
Performance comparison charts for the engineering team.

#### Site Health

Navigate to **Documents & Reports** → **Site Health** to view:

**Asset Status Overview**
- Assets due for testing
- Overdue tests
- Pass/fail rates by site
- Outstanding defects

**Compliance Scores**
- Sites with 100% compliance
- Sites requiring attention
- Risk-ranked site list

**Historical Trends**
- Test results over time
- Velocity decline trends
- Pressure maintenance trends

**Screenshot: Site Health Dashboard**
Traffic light dashboard showing compliance status for all sites.

---

## Field Companion Application

### Mobile Interface Overview

The Field Companion provides a streamlined, touch-optimised interface for engineers working on site.

#### Accessing Field Companion

**On Mobile Device:**
1. Open the Life Safety Ops app
2. Log in with your credentials
3. The app automatically opens in Engineer mode

**On Desktop/Tablet:**
1. Click the **Engineer Mode** toggle in the header
2. The interface switches to the mobile-optimised view

**Screenshot: Field Companion Home**
The mobile home screen showing assigned jobs and quick actions.

#### Key Features

| Feature | Description |
|---------|-------------|
| **Touch-Optimised Controls** | Large buttons and input areas for easy use with gloves |
| **Offline Capability** | Full functionality without internet connection |
| **Quick Job Access** | View and update assigned jobs |
| **Test Data Entry** | Record damper and stairwell readings |
| **Photo Documentation** | Capture and annotate images |
| **Signature Capture** | Obtain client sign-off on site |
| **Time Tracking** | Record arrival, departure, and work time |
| **Defect Logging** | Report issues found during testing |

#### Engineer Home Screen

The home screen displays:
- **Today's Jobs**: Jobs scheduled for today
- **Assigned Jobs**: All jobs assigned to you
- **Recent Activity**: Your latest actions
- **Quick Actions**: Start new test, log defect, etc.
- **Sync Status**: Online/offline indicator

**Screenshot: Engineer Dashboard**
The mobile dashboard showing job list and status indicators.

### Smoke Control Damper Testing

#### Understanding Grid Sizes

The platform automatically calculates the appropriate test grid based on damper dimensions per BSRIA BG 49/2024:

| Damper Face Area | Grid Size | Measurement Points |
|------------------|-----------|-------------------|
| Less than 0.25m² | 5×5 | 25 readings |
| 0.25m² to 0.50m² | 6×6 | 36 readings |
| Greater than 0.50m² | 7×7 | 49 readings |

**Calculation Example**:
- Damper dimensions: 750mm × 400mm
- Face area: 0.75 × 0.4 = 0.30m²
- Grid size: 6×6 (36 readings required)

**Screenshot: Grid Size Calculator**
The damper dimension entry screen showing automatic grid calculation.

#### Conducting a Damper Test

**Step 1: Select or Create Test**
1. Open the assigned job in Field Companion
2. Navigate to the damper to be tested
3. Tap **Start Test** or **Add New Damper**

**Step 2: Enter Damper Details**
1. Enter damper reference (e.g., "SD-A-01")
2. Enter dimensions:
   - Width (mm): e.g., 750
   - Height (mm): e.g., 400
3. Grid size calculates automatically
4. Enter design velocity (m/s): e.g., 8.0
5. Select system type: Push / Pull / Push-Pull

**Screenshot: Damper Details Entry**
The damper setup screen with dimension fields and calculated grid preview.

**Step 3: Take Readings**
1. The test grid appears on screen
2. Position yourself at the damper face
3. Start at top-left corner (Cell A1)
4. Take velocity reading with anemometer
5. Tap cell and enter reading
6. Move to next cell (Tab or tap)
7. Continue until all cells complete

**Navigation Options**:
- Tap next cell directly
- Use on-screen arrows
- Swipe to navigate
- Use external keyboard Tab key

**Screenshot: Test Grid Entry**
The interactive grid showing partially completed readings with colour coding.

**Step 4: Review Results**
As you enter readings, the system displays:
- **Average Velocity**: Mean of all readings (m/s)
- **Minimum Reading**: Lowest value recorded
- **Maximum Reading**: Highest value recorded
- **Standard Deviation**: Measure of consistency
- **Pass/Fail Status**: Compared to design velocity
- **Volumetric Flow Rate**: Calculated in m³/s

**Colour Coding**:
- **Green**: Reading within acceptable range
- **Amber**: Reading borderline (within 10% of limit)
- **Red**: Reading outside acceptable range

**Screenshot: Test Results Summary**
The completed grid with statistics and pass/fail indication.

**Step 5: Add Documentation**
1. Tap **Add Photo** to capture damper image
2. Annotate photo if needed (mark areas of concern)
3. Add notes about conditions
4. Record any observations

**Screenshot: Photo Annotation**
The photo capture and annotation interface.

**Step 6: Complete and Save**
1. Review all entered data
2. Tap **Complete Test**
3. Data saves locally (syncs when online)
4. Proceed to next damper or job

#### Interpreting Results

**Pass Criteria** (typical):
- Average velocity within ±10% of design
- No individual reading more than 20% below average
- Airflow direction correct

**Result Status**:
| Status | Meaning | Action |
|--------|---------|--------|
| Pass | Meets all criteria | Document and move on |
| Marginal Pass | Borderline acceptable | Note and monitor |
| Fail | Does not meet criteria | Log defect, arrange remedial |

**Screenshot: Pass/Fail Determination**
The results screen showing clear pass or fail indication with criteria.

#### Anomaly Detection

The system uses statistical analysis to flag unusual readings:

**How It Works**:
- Uses Median Absolute Deviation (MAD) algorithm
- Compares each reading to the damper average
- Flags readings more than 2 standard deviations from median

**Anomaly Indicators**:
- Orange highlight: Moderate anomaly
- Red highlight: Significant anomaly
- Alert icon with explanation

**Example Alert**:
"Cell C4 (3.2 m/s) is 58% below the damper average (7.6 m/s). This may indicate:
- Obstruction in this quadrant
- Damper blade damage
- Measurement error"

**Screenshot: Anomaly Detection**
A grid showing highlighted anomalous readings with explanation panel.

#### Trend Analysis

For previously tested dampers, view historical performance:

1. Open damper record
2. Navigate to **History** tab
3. View trend chart showing:
   - All previous test results
   - Date of each test
   - Average velocity over time
   - Trend line (increasing/stable/declining)
   - Design velocity reference line

**Predictive Features**:
- Velocity decline rate calculation
- Predicted time to minimum acceptable velocity
- Recommended maintenance date

**Screenshot: Trend Analysis Chart**
Line chart showing historical test results with trend projection.

### Stairwell Pressure Testing

#### Overview

For stairwell pressure differential testing per BS EN 12101-6:

**Test Scenarios**:
1. **All Doors Closed**: Baseline pressure measurement
2. **Single Door Open**: Pressure maintenance test
3. **Multiple Doors Open**: Evacuation simulation
4. **Door Force Test**: Opening force measurement

**Screenshot: Stairwell Test Selection**
The test type selection screen for pressure testing.

#### Setting Up a Stairwell Test

1. Select **Stairwell Test** from the job
2. Enter stairwell details:
   - Building name
   - Stairwell identifier (e.g., "Stair A")
   - Number of floors
   - Building standard: BS EN 12101-6:2022 / BS EN 12101-6:2005 / BS 5588-4:1998
   - Pressure class: A / B / C / D / E / F
3. Add floor levels (e.g., B1, G, 1, 2, 3... Roof)
4. System generates the test form

**Pressure Class Requirements**:
| Class | Minimum Pressure (Doors Closed) |
|-------|--------------------------------|
| A | 50 Pa ±10% |
| B | 45 Pa ±10% |
| C | 40 Pa ±10% |
| D | 35 Pa ±10% |
| E | 30 Pa ±10% |
| F | 25 Pa ±10% |

**Screenshot: Stairwell Setup**
The stairwell configuration screen with floor list.

#### Recording Pressure Readings

**Doors Closed Test**:
1. Ensure all stairwell doors are closed
2. At each floor, measure differential pressure across door
3. Enter reading (Pa) in corresponding field
4. System indicates pass/fail against class requirement

**Single Door Open Test**:
1. Open door at Ground floor
2. Measure pressure at all other floors
3. Enter readings
4. Repeat for each floor (open one door at a time)

**Door Force Test**:
1. At each floor, measure force to open door (Newton gauge)
2. Enter reading in corresponding field
3. Maximum typically 100N (140N for fire doors)

**Screenshot: Pressure Reading Entry**
The pressure test form showing floor-by-floor readings.

#### Compliance Criteria

**Doors Closed**:
- Minimum pressure: Per selected class
- Maximum pressure: Limited by door opening force

**Single Door Open**:
- Maintain minimum pressure at all other levels
- Airflow from stairwell into building (positive pressure)

**Door Opening Force**:
- Maximum 100N (general)
- Maximum 140N (fire doors in certain conditions)

**Screenshot: Pressure Test Results**
The summary showing overall pass/fail with floor-by-floor breakdown.

### Offline Synchronisation

#### How Offline Mode Works

The Field Companion maintains full functionality without internet:

**Offline Capabilities**:
- View assigned jobs and site details
- Conduct damper and stairwell tests
- Enter all readings and notes
- Capture and annotate photos
- Log defects
- Update job status
- Record time entries

**Data Storage**:
- All data stored securely on device
- Changes queued in sync queue
- Queue persists even if app closed

**Screenshot: Offline Indicator**
The status bar showing offline mode with pending sync count.

#### Syncing Data

**Automatic Sync**:
1. Reconnect to WiFi or mobile data
2. System automatically detects connection
3. Queued changes upload in background
4. New data downloads to device
5. Sync status indicator shows progress

**Manual Sync**:
1. Tap the sync icon in header
2. View pending changes
3. Tap **Sync Now** to force sync

**Conflict Resolution**:
If the same record was modified online and offline:
1. System notifies you of conflict
2. Shows both versions
3. Choose which version to keep
4. Or merge changes manually

**Screenshot: Sync Status**
The sync panel showing queue, progress, and last sync time.

### Job Execution & Updates

#### Starting a Job

1. Open the job from your assigned list
2. Review job details, site access notes
3. Tap **Start Job** or **I've Arrived**
4. Time tracking begins automatically
5. Job status updates to **In Progress**

**Screenshot: Job Start**
The job detail screen with start button and site access information.

#### Updating Job Progress

**Progress Updates**:
- Add notes as you work
- Upload photos of work completed
- Log materials used
- Record any issues encountered

**Status Updates**:
- **On Hold**: Tap to pause (with reason)
- **Resume**: Continue after pause
- **Request Parts**: Flag need for materials
- **Request Assistance**: Flag need for help

**Screenshot: Job Progress Update**
The progress panel showing notes, photos, and status options.

#### Completing a Job

1. Finish all testing and work
2. Tap **Complete Job**
3. Enter completion details:
   - Summary of work done
   - Any follow-up required
   - Client representative name
4. Capture client signature (touch to sign)
5. Confirm completion
6. Job status updates to **Completed**

**Screenshot: Job Completion**
The completion dialog with signature capture.

### Defect Logging & Risk Assessments

#### Logging a Defect

If issues are found during testing or inspection:

1. From the job or asset, tap **Log Defect**
2. Enter defect details:

**Defect Information**
- **Title**: Brief description (e.g., "Damper blade bent")
- **Description**: Detailed observation
- **Asset**: Select affected asset
- **Location**: Specific location

**Classification**
- **Severity**: Critical / Major / Minor
- **Category**: Mechanical / Electrical / Controls / Structural

**Evidence**
- **Photo**: Capture image of defect
- **Annotation**: Mark up photo to highlight issue

**Recommendation**
- **Recommended Action**: What should be done
- **Urgency**: Immediate / Within 7 days / Within 30 days / At next service

3. Click **Save**

Defect is logged and:
- Appears in Defect Register
- Links to asset and job
- Triggers notification to office
- Flagged for follow-up

**Screenshot: Defect Logging**
The defect entry form with photo annotation.

#### Risk Assessments

Before starting work, complete risk assessment:

1. From job, tap **Risk Assessment**
2. Review standard hazards checklist
3. Add site-specific hazards
4. Record control measures
5. Sign to confirm assessment complete
6. Risk assessment attached to job record

**Screenshot: Risk Assessment**
The risk assessment checklist with signature.

---

## Compliance & Regulations

### BS EN 12101 Standards

The platform supports compliance with the full BS EN 12101 series:

| Standard | Title | Application |
|----------|-------|-------------|
| BS EN 12101-1 | Smoke barriers | Smoke curtain specifications |
| BS EN 12101-2 | Natural smoke and heat exhaust ventilators | AOV testing |
| BS EN 12101-3 | Powered smoke and heat control ventilators | Fan system testing |
| BS EN 12101-4 | Smoke and heat exhaust ventilation systems | System design |
| BS EN 12101-5 | Guidelines on functional recommendations | Design guidance |
| BS EN 12101-6 | Pressure differential systems | Stairwell testing |
| BS EN 12101-7 | Smoke duct sections | Ductwork specifications |
| BS EN 12101-8 | Smoke control dampers | Damper testing |
| BS EN 12101-10 | Power supplies | Electrical requirements |
| BS EN 12101-13 | Pressure differential systems kits | Kit specifications |
| BS ISO 21927-9 | Control panels | Panel specifications |

**Additional Standards Referenced**:
- BS 7346-8: Smoke control systems
- BS 9999: Fire safety in buildings
- BS 9991: Fire safety in residential buildings
- RRFSO 2005: Regulatory Reform (Fire Safety) Order
- BSRIA BG 49/2024: Commissioning air systems

**Screenshot: Standards Reference**
The built-in standards reference library.

### Building Safety Act Compliance

The platform supports Building Safety Act requirements through:

**Key BSA Features**:
- **Golden Thread Documentation**: Complete audit trail of all safety information
- **Traceability**: Every test, change, and decision is recorded
- **Access Control**: Role-based permissions ensure data integrity
- **Historical Records**: Full history maintained for accountability
- **Version Control**: Track document changes over time
- **Resident Engagement**: Share safety information appropriately

**Screenshot: BSA Compliance Dashboard**
The compliance overview showing Building Safety Act readiness.

### Golden Thread Documentation

Navigate to **Compliance & Safety** → **Golden Thread** to access:

#### Document Vault

The Golden Thread vault stores all safety-critical building information:

**Document Categories**:
- Design Documents
- As-Built Drawings
- Test Certificates
- Risk Assessments
- Maintenance Records
- Incident Reports
- O&M Manuals
- Specifications

**Screenshot: Golden Thread Vault**
The document library showing categorised documents.

#### Uploading Documents

1. Navigate to **Golden Thread**
2. Click **Upload Document**
3. Select document type from list
4. Add metadata:
   - **Title**: Document name
   - **Version**: Version number
   - **Author**: Who created it
   - **Date**: Document date
   - **Related Asset/Site**: Link to asset or site
   - **Tags**: Searchable keywords
5. Upload the file (PDF, Word, Excel, images)
6. Click **Save**

**Screenshot: Document Upload**
The upload dialog with metadata fields.

#### Version Control

When updating a document:
1. Open existing document
2. Click **Upload New Version**
3. Add version notes (what changed)
4. Upload new file
5. Previous versions remain accessible

**Audit Trail**:
- Who uploaded/modified
- When changes made
- What changed
- Full version history

**Screenshot: Version History**
The version history panel showing all document versions.

### Professional PDF Reports

#### Report Types Available

| Report Type | Purpose | When Used |
|-------------|---------|-----------|
| Commissioning Certificate | New installation verification | Project handover |
| Annual Inspection Report | Regular compliance check | Maintenance contract |
| Remedial Works Report | After repairs/modifications | Post-remediation |
| Summary Report | Quick overview | Client updates |
| Test Certificate | Individual test record | Per-damper/system |

**Screenshot: Report Type Selection**
The report generation menu showing available types.

#### Generating a Report

1. Complete all required testing
2. Navigate to job or tests
3. Click **Generate Report**
4. Select report type
5. Review and complete:
   - Company branding (from settings)
   - Engineer details
   - Witness details (if applicable)
   - Summary notes
   - Recommendations
6. Capture digital signatures
7. Click **Generate PDF**
8. Report creates in seconds

**Report Contents**:
- Cover page with branding
- Executive summary
- Site and system details
- All test data with grids
- Visual representations
- Compliance statements
- Standard references
- Digital signatures
- Unique report reference
- QR code for verification

**Screenshot: PDF Report Preview**
A sample generated PDF showing professional layout.

#### QR Code Verification

Each report includes a unique QR code that:
- Links to online verification page
- Confirms report authenticity
- Shows issue date and engineer
- Cannot be forged or altered

**Screenshot: QR Verification**
The QR code on a report and the verification page.

---

## Organisation Management

### Role-Based Access Control

The platform uses role-based permissions to control access:

| Role | Description | Permissions |
|------|-------------|-------------|
| **Owner** | Organisation creator/owner | Full access including billing, deletion, all features |
| **Admin** | Full administrator | Manage team, full data access, cannot delete org |
| **Office Staff** | Office-based users | CRM, scheduling, invoicing, reports |
| **Engineer** | Field technicians | Jobs, testing, defects, time tracking |
| **Viewer** | Read-only access | View data only, no modifications |

**Permission Matrix**:

| Feature | Owner | Admin | Office | Engineer | Viewer |
|---------|-------|-------|--------|----------|--------|
| View Dashboard | Yes | Yes | Yes | Yes | Yes |
| Create Clients | Yes | Yes | Yes | No | No |
| Create Jobs | Yes | Yes | Yes | No | No |
| Assign Jobs | Yes | Yes | Yes | No | No |
| Complete Jobs | Yes | Yes | Yes | Yes | No |
| Enter Test Data | Yes | Yes | Yes | Yes | No |
| Generate Reports | Yes | Yes | Yes | Yes | No |
| Create Invoices | Yes | Yes | Yes | No | No |
| Manage Team | Yes | Yes | No | No | No |
| Organisation Settings | Yes | Yes | No | No | No |
| Delete Organisation | Yes | No | No | No | No |

**Screenshot: Permissions Matrix**
The settings page showing role permissions.

### Managing Team Members

1. Navigate to **Settings** → **Team**
2. View all current team members with:
   - Name and email
   - Role badge
   - Status (active/invited)
   - Last active date

**Available Actions**:
- **Change Role**: Update member's role (Admin/Owner only)
- **Remove Member**: Remove from organisation
- **Resend Invitation**: For pending invitations
- **Cancel Invitation**: Remove pending invitation

**Screenshot: Team Management**
The team tab showing members and management options.

### Organisation Settings

1. Navigate to **Settings** → **Organisation**
2. Update organisation details:
   - **Organisation Name**: Company name
   - **Email**: Primary contact email
   - **Phone**: Office phone number
   - **Address**: Business address
   - **Website**: Company website
3. Click **Save Changes**

Settings sync to all users in the organisation.

**Screenshot: Organisation Settings**
The organisation settings form with branding options.

---

## Appendices

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl + N | New item (context-sensitive) |
| Ctrl + S | Save current record |
| Ctrl + F | Open search |
| Escape | Close dialog/cancel |
| Tab | Move to next field |
| Shift + Tab | Move to previous field |
| Arrow Keys | Navigate grid cells |
| Enter | Confirm/submit |

### Troubleshooting

**Problem: Data not syncing**
- Check internet connection status
- Refresh the page (Ctrl + R)
- Check sync status indicator for errors
- Try manual sync from settings

**Problem: Cannot log in**
- Clear browser cache and cookies
- Try a different browser
- Check for service announcements
- Contact support

**Problem: Missing menu items**
- Check your role permissions
- Contact your administrator
- Verify organisation membership

**Problem: Report generation fails**
- Ensure all required data is entered
- Check for validation errors
- Try generating in a different browser

**Problem: Photos not uploading**
- Check available storage on device
- Reduce image size if very large
- Check internet connection

### Support

For technical support:
- **In-App Help**: Click help icon in header
- **Documentation**: Downloads section in app
- **Email**: support@lifesafetyops.com

### Glossary

| Term | Definition |
|------|------------|
| AOV | Automatic Opening Vent - a vent that opens automatically on fire signal |
| BSA | Building Safety Act 2022 |
| CPD | Continuing Professional Development |
| m/s | Metres per second (velocity unit) |
| N | Newton (force unit) |
| O&M | Operation and Maintenance |
| Pa | Pascal (pressure unit) |
| PDC | Pressure Differential System |
| SHEVS | Smoke and Heat Exhaust Ventilation System |
| SLA | Service Level Agreement |
| VAT | Value Added Tax |

### System Requirements

**Web Application**:
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- JavaScript enabled
- 1280×720 minimum resolution recommended

**Mobile Application**:
- iOS 14.0 or later
- Android 10.0 or later
- 100MB storage space
- Camera access (for photos)

---

**Document Version**: 1.0
**Last Updated**: December 2024
**Platform**: Life Safety Ops - Life Safety Operations & Compliance Management Platform

**© 2024 All Rights Reserved**
