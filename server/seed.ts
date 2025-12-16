import { storage } from "./storage";

const TEST_USER_ID = "test-user-shared";

const UK_COMPANIES = [
  {
    companyName: "Metropolitan Fire Protection Ltd",
    contactName: "James Richardson",
    email: "j.richardson@metrofp.co.uk",
    phone: "020 7946 0958",
    address: "45 Victoria Street",
    postcode: "SW1H 0EU",
    city: "London",
    clientType: "commercial",
    status: "active",
    priority: "vip",
    vatNumber: "GB123456789",
    paymentTerms: 30,
  },
  {
    companyName: "Northern Heights Property Management",
    contactName: "Sarah Mitchell",
    email: "s.mitchell@northernheights.co.uk",
    phone: "0161 234 5678",
    address: "78 Piccadilly Gardens",
    postcode: "M1 2BN",
    city: "Manchester",
    clientType: "commercial",
    status: "active",
    priority: "preferred",
    vatNumber: "GB987654321",
    paymentTerms: 14,
  },
  {
    companyName: "Birmingham City Council - Estates",
    contactName: "David Thompson",
    email: "d.thompson@birmingham.gov.uk",
    phone: "0121 303 9944",
    address: "Council House, Victoria Square",
    postcode: "B1 1BB",
    city: "Birmingham",
    clientType: "public_sector",
    status: "active",
    priority: "standard",
    paymentTerms: 60,
  },
  {
    companyName: "Harland Residential Trust",
    contactName: "Emma Williams",
    email: "e.williams@harlandtrust.org.uk",
    phone: "0113 245 6789",
    address: "The Calls",
    postcode: "LS2 7EY",
    city: "Leeds",
    clientType: "residential",
    status: "active",
    priority: "preferred",
    paymentTerms: 30,
  },
  {
    companyName: "Glasgow Tower Management",
    contactName: "Robert MacLeod",
    email: "r.macleod@glasgowtower.co.uk",
    phone: "0141 332 5566",
    address: "123 Buchanan Street",
    postcode: "G1 2JG",
    city: "Glasgow",
    clientType: "commercial",
    status: "active",
    priority: "standard",
    vatNumber: "GB555666777",
    paymentTerms: 30,
  },
  {
    companyName: "Bristol Harbourside Developments",
    contactName: "Catherine Green",
    email: "c.green@bristolharbourside.co.uk",
    phone: "0117 927 3344",
    address: "Harbourside Walk",
    postcode: "BS1 5SZ",
    city: "Bristol",
    clientType: "commercial",
    status: "prospect",
    priority: "standard",
    paymentTerms: 30,
  },
];

const BUILDINGS = [
  {
    name: "Meridian Tower",
    address: "15-25 Canary Wharf, London",
    postcode: "E14 5AB",
    floors: 32,
    dampersPerFloor: 4,
  },
  {
    name: "Northern Quarter Complex",
    address: "Oldham Street, Manchester",
    postcode: "M4 1LF",
    floors: 18,
    dampersPerFloor: 3,
  },
  {
    name: "Centenary Building",
    address: "Centenary Square, Birmingham",
    postcode: "B1 2ND",
    floors: 12,
    dampersPerFloor: 6,
  },
  {
    name: "Aire Heights",
    address: "Whitehall Road, Leeds",
    postcode: "LS1 4HR",
    floors: 24,
    dampersPerFloor: 4,
  },
  {
    name: "Clyde View Tower",
    address: "Pacific Quay, Glasgow",
    postcode: "G51 1EA",
    floors: 20,
    dampersPerFloor: 5,
  },
  {
    name: "Harbourside Lofts",
    address: "Welsh Back, Bristol",
    postcode: "BS1 4SB",
    floors: 8,
    dampersPerFloor: 2,
  },
];

const ENGINEERS = [
  { name: "Mike Johnson", competency: "Senior Engineer" },
  { name: "Paul Stevens", competency: "Lead Technician" },
  { name: "Chris Davies", competency: "Certified Technician" },
  { name: "Tom Wilson", competency: "Senior Engineer" },
  { name: "Alex Brown", competency: "Apprentice" },
];

const STAFF_MEMBERS = [
  {
    employeeNumber: "EMP001",
    firstName: "Michael",
    lastName: "Johnson",
    email: "m.johnson@company.co.uk",
    phone: "020 7946 1234",
    mobile: "07700 900123",
    jobTitle: "Senior Smoke Control Engineer",
    department: "Engineering",
    startDate: "2018-03-15",
    employmentType: "full_time",
    lineManager: "Operations Director",
    address: "42 High Street, Croydon",
    postcode: "CR0 1PD",
    drivingLicence: true,
    drivingLicenceExpiry: "2028-06-30",
    skills: ["Smoke Control Testing", "Damper Commissioning", "Stairwell Pressurisation", "BMS Integration", "Report Writing"],
    qualifications: ["NVQ Level 3 Building Services", "BSRIA Commissioning Certificate", "CSCS Gold Card", "First Aid at Work"],
  },
  {
    employeeNumber: "EMP002",
    firstName: "Paul",
    lastName: "Stevens",
    email: "p.stevens@company.co.uk",
    phone: "020 7946 1235",
    mobile: "07700 900124",
    jobTitle: "Lead Technician",
    department: "Engineering",
    startDate: "2019-07-01",
    employmentType: "full_time",
    lineManager: "Michael Johnson",
    address: "15 Oak Avenue, Bromley",
    postcode: "BR1 2AA",
    drivingLicence: true,
    drivingLicenceExpiry: "2027-03-15",
    skills: ["Smoke Control Testing", "Damper Commissioning", "AOV Systems", "Electrical Testing"],
    qualifications: ["NVQ Level 3 Building Services", "18th Edition Wiring Regulations", "CSCS Gold Card"],
  },
  {
    employeeNumber: "EMP003",
    firstName: "Christopher",
    lastName: "Davies",
    email: "c.davies@company.co.uk",
    phone: "020 7946 1236",
    mobile: "07700 900125",
    jobTitle: "Certified Technician",
    department: "Engineering",
    startDate: "2020-09-14",
    employmentType: "full_time",
    lineManager: "Paul Stevens",
    address: "8 Maple Road, Lewisham",
    postcode: "SE13 5NN",
    drivingLicence: true,
    drivingLicenceExpiry: "2029-11-20",
    skills: ["Smoke Control Testing", "Damper Servicing", "Fan Systems"],
    qualifications: ["NVQ Level 2 Building Services", "CSCS Blue Card", "Working at Heights"],
  },
  {
    employeeNumber: "EMP004",
    firstName: "Thomas",
    lastName: "Wilson",
    email: "t.wilson@company.co.uk",
    phone: "0161 234 5679",
    mobile: "07700 900126",
    jobTitle: "Senior Smoke Control Engineer",
    department: "Engineering - North",
    startDate: "2017-01-09",
    employmentType: "full_time",
    lineManager: "Operations Director",
    address: "23 Station Road, Salford",
    postcode: "M5 4WT",
    drivingLicence: true,
    drivingLicenceExpiry: "2026-08-12",
    skills: ["Smoke Control Testing", "Damper Commissioning", "Stairwell Pressurisation", "Project Management", "Client Liaison"],
    qualifications: ["HNC Building Services Engineering", "BSRIA Commissioning Certificate", "CSCS Gold Card", "IOSH Managing Safely"],
  },
  {
    employeeNumber: "EMP005",
    firstName: "Alexander",
    lastName: "Brown",
    email: "a.brown@company.co.uk",
    phone: "020 7946 1237",
    mobile: "07700 900127",
    jobTitle: "Apprentice Technician",
    department: "Engineering",
    startDate: "2024-01-08",
    employmentType: "apprentice",
    lineManager: "Christopher Davies",
    address: "17 New Street, Greenwich",
    postcode: "SE10 9EW",
    drivingLicence: false,
    skills: ["Basic Smoke Control Testing", "Equipment Handling"],
    qualifications: ["CSCS Green Card", "Level 2 Diploma in Progress"],
  },
  {
    employeeNumber: "EMP006",
    firstName: "Sarah",
    lastName: "Mitchell",
    email: "s.mitchell@company.co.uk",
    phone: "020 7946 1238",
    mobile: "07700 900128",
    jobTitle: "Technician",
    department: "Engineering",
    startDate: "2022-04-25",
    employmentType: "full_time",
    lineManager: "Paul Stevens",
    address: "56 Victoria Road, Wandsworth",
    postcode: "SW18 3HE",
    drivingLicence: true,
    drivingLicenceExpiry: "2030-02-28",
    skills: ["Smoke Control Testing", "Damper Servicing", "Documentation", "Customer Service"],
    qualifications: ["NVQ Level 2 Building Services", "CSCS Blue Card", "First Aid at Work"],
  },
  {
    employeeNumber: "EMP007",
    firstName: "James",
    lastName: "Taylor",
    email: "j.taylor@company.co.uk",
    phone: "0121 303 9945",
    mobile: "07700 900129",
    jobTitle: "Regional Engineer",
    department: "Engineering - Midlands",
    startDate: "2019-11-11",
    employmentType: "full_time",
    lineManager: "Operations Director",
    address: "89 Corporation Street, Birmingham",
    postcode: "B4 6TE",
    drivingLicence: true,
    drivingLicenceExpiry: "2027-07-19",
    skills: ["Smoke Control Testing", "Damper Commissioning", "Stairwell Pressurisation", "Fault Diagnosis"],
    qualifications: ["NVQ Level 3 Building Services", "BSRIA Commissioning Certificate", "CSCS Gold Card", "Confined Spaces"],
  },
  {
    employeeNumber: "EMP008",
    firstName: "David",
    lastName: "Clark",
    email: "d.clark@company.co.uk",
    phone: "0141 332 5567",
    mobile: "07700 900130",
    jobTitle: "Trainee Technician",
    department: "Engineering - Scotland",
    startDate: "2023-06-05",
    employmentType: "full_time",
    lineManager: "Thomas Wilson",
    address: "12 Argyle Street, Glasgow",
    postcode: "G2 8AG",
    drivingLicence: true,
    drivingLicenceExpiry: "2031-04-22",
    skills: ["Basic Smoke Control Testing", "Equipment Setup", "Site Preparation"],
    qualifications: ["CSCS Green Card", "Manual Handling"],
  },
];

function generateReadings(gridSize: number): (number | "")[] {
  const totalPoints = gridSize * gridSize;
  const readings: (number | "")[] = [];
  const baseVelocity = 2.5 + Math.random() * 2;
  for (let i = 0; i < totalPoints; i++) {
    const variation = (Math.random() - 0.5) * 1.2;
    readings.push(Math.round((baseVelocity + variation) * 100) / 100);
  }
  return readings;
}

function getGridSizeForDimensions(width: number, height: number): number {
  const area = width * height;
  if (area <= 0.36) return 5;
  if (area <= 0.64) return 6;
  return 7;
}

export async function seedDatabase(): Promise<{ success: boolean; message: string; counts?: any }> {
  try {
    console.log("Starting database seed...");
    
    const createdClients: any[] = [];
    const createdContracts: any[] = [];
    const createdProjects: any[] = [];
    const createdJobs: any[] = [];
    const createdDampers: any[] = [];
    const createdTests: any[] = [];
    const createdStaff: any[] = [];

    // Seed staff/engineers
    for (const staff of STAFF_MEMBERS) {
      const member = await storage.createStaffMember({
        userId: TEST_USER_ID,
        ...staff,
      });
      createdStaff.push(member);
      console.log(`Created staff: ${member.firstName} ${member.lastName}`);
    }

    for (const company of UK_COMPANIES) {
      const client = await storage.createClient({
        userId: TEST_USER_ID,
        ...company,
      });
      createdClients.push(client);
      console.log(`Created client: ${client.companyName}`);
    }

    for (let i = 0; i < createdClients.length; i++) {
      const client = createdClients[i];
      if (client.status !== "prospect") {
        const contractCount = Math.floor(Math.random() * 2) + 1;
        for (let c = 0; c < contractCount; c++) {
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12));
          const endDate = new Date(startDate);
          endDate.setFullYear(endDate.getFullYear() + 1);
          
          const contract = await storage.createContract({
            userId: TEST_USER_ID,
            clientId: client.id,
            contractNumber: `CON-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}${c > 0 ? `-${c + 1}` : ''}`,
            title: c === 0 
              ? `Annual Smoke Control Maintenance - ${client.companyName}`
              : `Emergency Call-Out Agreement - ${client.companyName}`,
            description: c === 0 
              ? "Annual maintenance and testing of all smoke control systems including dampers, AOVs, and stairwell pressurisation systems."
              : "24/7 emergency response for smoke control system faults with 4-hour SLA.",
            value: c === 0 ? 8500 + Math.floor(Math.random() * 15000) : 3500 + Math.floor(Math.random() * 5000),
            billingFrequency: c === 0 ? "annual" : "quarterly",
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            slaLevel: c === 0 ? "standard" : "premium",
            status: "active",
            autoRenew: true,
          });
          createdContracts.push(contract);
          console.log(`Created contract: ${contract.contractNumber}`);
        }
      }
    }

    for (let i = 0; i < BUILDINGS.length; i++) {
      const building = BUILDINGS[i];
      const client = createdClients[i % createdClients.length];
      
      const project = await storage.createProject({
        userId: TEST_USER_ID,
        name: building.name,
        description: `Smoke control system for ${building.name} - ${building.floors} floor ${client.clientType} building`,
        siteAddress: building.address,
        sitePostcode: building.postcode,
        clientName: client.companyName,
        mainContractor: ["Balfour Beatty", "Kier Group", "Willmott Dixon", "ISG Construction"][Math.floor(Math.random() * 4)],
        buildings: [building.name],
      });
      createdProjects.push(project);
      console.log(`Created project: ${project.name}`);

      const clientContracts = createdContracts.filter(c => c.clientId === client.id);
      const contract = clientContracts.length > 0 ? clientContracts[0] : null;

      const jobTypes = ["testing", "installation", "maintenance", "repair"];
      const jobStatuses = ["completed", "completed", "in_progress", "scheduled", "pending"];
      const jobCount = Math.floor(Math.random() * 3) + 2;

      for (let j = 0; j < jobCount; j++) {
        const jobDate = new Date();
        jobDate.setDate(jobDate.getDate() - Math.floor(Math.random() * 90));
        const jobStatus = jobStatuses[Math.floor(Math.random() * jobStatuses.length)];
        const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
        const assignedEngineer = ENGINEERS[Math.floor(Math.random() * ENGINEERS.length)];
        
        const job = await storage.createJob({
          userId: TEST_USER_ID,
          clientId: client.id,
          contractId: contract?.id || null,
          projectId: project.id,
          jobNumber: `JOB-${new Date().getFullYear()}-${String(createdJobs.length + 1).padStart(4, '0')}`,
          title: `${jobType.charAt(0).toUpperCase() + jobType.slice(1)} - ${building.name}`,
          description: `${jobType === "testing" ? "Annual velocity testing" : jobType === "installation" ? "New damper installation" : jobType === "maintenance" ? "Scheduled maintenance" : "Corrective repair"} at ${building.name}`,
          siteAddress: building.address,
          scheduledDate: jobDate.toISOString().split('T')[0],
          scheduledTime: ["08:00", "09:00", "10:00", "13:00", "14:00"][Math.floor(Math.random() * 5)],
          estimatedDuration: [2, 4, 6, 8][Math.floor(Math.random() * 4)],
          actualDuration: jobStatus === "completed" ? [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)] : null,
          priority: ["normal", "normal", "high", "urgent"][Math.floor(Math.random() * 4)],
          status: jobStatus,
          jobType: jobType,
          engineerCount: Math.floor(Math.random() * 2) + 1,
          engineerNames: [assignedEngineer],
          quotedAmount: 1500 + Math.floor(Math.random() * 3000),
          notes: `Access via ${["main reception", "loading bay", "service entrance"][Math.floor(Math.random() * 3)]}. Report to ${["facilities manager", "building security", "site office"][Math.floor(Math.random() * 3)]}.`,
          systemCondition: jobStatus === "completed" ? ["operational", "operational", "impaired"][Math.floor(Math.random() * 3)] : null,
        });
        createdJobs.push(job);
        console.log(`Created job: ${job.jobNumber}`);

        if (jobStatus === "completed" && jobType === "testing") {
          const dampersToTest = Math.min(building.dampersPerFloor * 3, 12);
          for (let d = 0; d < dampersToTest; d++) {
            const floorNum = Math.floor(d / building.dampersPerFloor) + 1;
            const damperOnFloor = (d % building.dampersPerFloor) + 1;
            const damperKey = `${building.name.substring(0, 3).toUpperCase()}-F${String(floorNum).padStart(2, '0')}-D${String(damperOnFloor).padStart(2, '0')}`;
            
            let damper = createdDampers.find(dm => dm.damperKey === damperKey);
            if (!damper) {
              damper = await storage.createDamper({
                userId: TEST_USER_ID,
                damperKey: damperKey,
                building: building.name,
                location: `Floor ${floorNum} - ${["Corridor A", "Corridor B", "Stairwell", "Lobby"][damperOnFloor % 4]}`,
                floorNumber: String(floorNum),
                shaftId: `S${Math.ceil(damperOnFloor / 2)}`,
                systemType: ["push", "pull", "push-pull"][Math.floor(Math.random() * 3)],
                description: `Smoke control damper - ${["inlet", "extract", "transfer"][Math.floor(Math.random() * 3)]}`,
              });
              createdDampers.push(damper);
            }

            const damperWidth = [0.3, 0.4, 0.5, 0.6][Math.floor(Math.random() * 4)];
            const damperHeight = [0.3, 0.4, 0.5, 0.6][Math.floor(Math.random() * 4)];
            const gridSize = getGridSizeForDimensions(damperWidth, damperHeight);
            const readings = generateReadings(gridSize);
            const average = readings.filter(r => typeof r === 'number').reduce((a, b) => a + (b as number), 0) / readings.filter(r => typeof r === 'number').length;

            const test = await storage.createTest({
              userId: TEST_USER_ID,
              damperId: damper.id,
              testDate: jobDate.toISOString().split('T')[0],
              building: building.name,
              location: damper.location,
              floorNumber: damper.floorNumber,
              shaftId: damper.shaftId,
              systemType: damper.systemType,
              testerName: assignedEngineer.name,
              notes: "",
              readings: readings,
              gridSize: gridSize,
              average: Math.round(average * 100) / 100,
              damperWidth: damperWidth,
              damperHeight: damperHeight,
              freeArea: Math.round(damperWidth * damperHeight * 0.85 * 10000) / 10000,
              visitType: ["initial", "annual", "annual"][Math.floor(Math.random() * 3)],
            });
            createdTests.push(test);
          }
          console.log(`Created ${dampersToTest} tests for job ${job.jobNumber}`);
        }
      }
    }

    // ===== FINANCIAL DATA =====
    const createdQuotes: any[] = [];
    const createdInvoices: any[] = [];
    const createdExpenses: any[] = [];
    const createdTimesheets: any[] = [];
    const createdMileageClaims: any[] = [];

    // QUOTES - 12 quotes with various statuses
    const quoteData = [
      { title: "Annual Smoke Control Maintenance - Meridian Tower", status: "accepted", total: 12500 },
      { title: "AOV System Commissioning - Northern Quarter", status: "accepted", total: 8750 },
      { title: "Fire Damper Testing - Centenary Building", status: "sent", total: 4200 },
      { title: "Stairwell Pressurisation Survey - Aire Heights", status: "sent", total: 6800 },
      { title: "Emergency Repair Works - Clyde View Tower", status: "accepted", total: 3500 },
      { title: "NShev System Annual Service", status: "draft", total: 9200 },
      { title: "Car Park Ventilation Commissioning", status: "rejected", total: 15000 },
      { title: "Smoke Curtain Installation Quote", status: "expired", total: 22000 },
      { title: "Fire Damper Replacement Programme", status: "accepted", total: 45000 },
      { title: "BMS Integration - Phase 2", status: "sent", total: 18500 },
      { title: "Quarterly Maintenance Contract", status: "draft", total: 7600 },
      { title: "Reactive Call-Out Agreement Renewal", status: "accepted", total: 5400 },
    ];

    for (let i = 0; i < quoteData.length; i++) {
      const q = quoteData[i];
      const client = createdClients[i % createdClients.length];
      const job = createdJobs[i % createdJobs.length];
      const validDate = new Date();
      validDate.setDate(validDate.getDate() + (q.status === 'expired' ? -30 : 30));
      
      const subtotal = q.total / 1.2;
      const vatAmount = subtotal * 0.2;
      
      const quote = await storage.createQuote({
        userId: TEST_USER_ID,
        clientId: client.id,
        jobId: job?.id || null,
        quoteNumber: `QUO-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
        title: q.title,
        description: `Comprehensive quotation for ${q.title.toLowerCase()} including all labour, materials, and certification.`,
        lineItems: [
          { id: `line-${i}-1`, description: "Labour costs - Site attendance and testing", quantity: 1, unitPrice: subtotal * 0.6, total: subtotal * 0.6 },
          { id: `line-${i}-2`, description: "Materials and equipment", quantity: 1, unitPrice: subtotal * 0.25, total: subtotal * 0.25 },
          { id: `line-${i}-3`, description: "Certification and documentation", quantity: 1, unitPrice: subtotal * 0.15, total: subtotal * 0.15 },
        ],
        subtotal: subtotal,
        vatRate: 20,
        vatAmount: vatAmount,
        total: q.total,
        validUntil: validDate.toISOString().split('T')[0],
        terms: "Payment due within 30 days of invoice. 50% deposit required for orders over £10,000.",
        status: q.status,
      });
      createdQuotes.push(quote);
      console.log(`Created quote: ${quote.quoteNumber}`);
    }

    // INVOICES - 15 invoices with various statuses
    const invoiceData = [
      { title: "Annual Maintenance - Q1 Invoice", status: "paid", total: 3125, daysAgo: 45 },
      { title: "Emergency Call-Out - Fan Failure", status: "paid", total: 1850, daysAgo: 30 },
      { title: "Commissioning Works - Phase 1", status: "paid", total: 8500, daysAgo: 60 },
      { title: "Annual Maintenance - Q2 Invoice", status: "paid", total: 3125, daysAgo: 15 },
      { title: "Damper Replacement Works", status: "paid", total: 4200, daysAgo: 20 },
      { title: "Stairwell Testing Certificate", status: "sent", total: 2800, daysAgo: 7 },
      { title: "Annual Maintenance - Q3 Invoice", status: "sent", total: 3125, daysAgo: 5 },
      { title: "AOV Servicing Works", status: "sent", total: 1650, daysAgo: 3 },
      { title: "Fire Curtain Annual Test", status: "overdue", total: 2400, daysAgo: 35 },
      { title: "NShev System Repairs", status: "overdue", total: 5600, daysAgo: 50 },
      { title: "Car Park Ventilation Service", status: "draft", total: 4800, daysAgo: 0 },
      { title: "BMS Panel Upgrade", status: "draft", total: 7200, daysAgo: 0 },
      { title: "Smoke Shaft Commissioning", status: "paid", total: 12500, daysAgo: 75 },
      { title: "Reactive Repairs - Control Panel", status: "sent", total: 3400, daysAgo: 10 },
      { title: "Annual Inspection Certificate", status: "paid", total: 1200, daysAgo: 40 },
    ];

    for (let i = 0; i < invoiceData.length; i++) {
      const inv = invoiceData[i];
      const client = createdClients[i % createdClients.length];
      const job = createdJobs[i % createdJobs.length];
      const contract = createdContracts[i % createdContracts.length];
      const quote = i < createdQuotes.length ? createdQuotes[i] : null;
      
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - inv.daysAgo);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);
      
      const subtotal = inv.total / 1.2;
      const vatAmount = subtotal * 0.2;
      
      const invoice = await storage.createInvoice({
        userId: TEST_USER_ID,
        clientId: client.id,
        jobId: job?.id || null,
        contractId: contract?.id || null,
        quoteId: quote?.id || null,
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
        title: inv.title,
        description: `Invoice for ${inv.title.toLowerCase()} - completed works and certification.`,
        lineItems: [
          { id: `inv-line-${i}-1`, description: "Professional services rendered", quantity: 1, unitPrice: subtotal * 0.7, total: subtotal * 0.7 },
          { id: `inv-line-${i}-2`, description: "Materials supplied", quantity: 1, unitPrice: subtotal * 0.2, total: subtotal * 0.2 },
          { id: `inv-line-${i}-3`, description: "Documentation and certification", quantity: 1, unitPrice: subtotal * 0.1, total: subtotal * 0.1 },
        ],
        subtotal: subtotal,
        vatRate: 20,
        vatAmount: vatAmount,
        total: inv.total,
        dueDate: dueDate.toISOString().split('T')[0],
        terms: "Payment due within 30 days. Bank details: Sort 40-00-01, Account 12345678",
        status: inv.status,
        paidAmount: inv.status === 'paid' ? inv.total : 0,
      });
      createdInvoices.push(invoice);
      console.log(`Created invoice: ${invoice.invoiceNumber}`);
    }

    // EXPENSES - 25+ expenses across all categories
    const expenseData = [
      { category: "fuel", description: "Diesel - Company Van VN23 ABC", amount: 85.50, daysAgo: 2 },
      { category: "fuel", description: "Diesel - Site Visit London", amount: 62.30, daysAgo: 5 },
      { category: "fuel", description: "Diesel - Manchester Trip", amount: 95.00, daysAgo: 8 },
      { category: "materials", description: "Smoke pellets - Testing supplies", amount: 124.99, daysAgo: 3 },
      { category: "materials", description: "Replacement actuator - Belimo", amount: 385.00, daysAgo: 7 },
      { category: "materials", description: "Cable and connectors", amount: 67.50, daysAgo: 12 },
      { category: "materials", description: "Damper blade assembly", amount: 225.00, daysAgo: 15 },
      { category: "accommodation", description: "Premier Inn - Glasgow 2 nights", amount: 178.00, daysAgo: 10 },
      { category: "accommodation", description: "Travelodge Birmingham", amount: 65.00, daysAgo: 18 },
      { category: "accommodation", description: "Holiday Inn Leeds", amount: 89.00, daysAgo: 25 },
      { category: "tools", description: "Anemometer calibration", amount: 145.00, daysAgo: 30 },
      { category: "tools", description: "Digital manometer probe", amount: 89.99, daysAgo: 35 },
      { category: "tools", description: "PPE replacement - Hard hats", amount: 45.00, daysAgo: 20 },
      { category: "mileage", description: "Site visit - Canary Wharf", amount: 22.50, mileage: 50, daysAgo: 1 },
      { category: "mileage", description: "Client meeting - Westminster", amount: 18.00, mileage: 40, daysAgo: 4 },
      { category: "mileage", description: "Emergency callout - Stratford", amount: 31.50, mileage: 70, daysAgo: 6 },
      { category: "mileage", description: "Training course - Reading", amount: 67.50, mileage: 150, daysAgo: 14 },
      { category: "other", description: "Parking - Meridian Tower site", amount: 15.00, daysAgo: 2 },
      { category: "other", description: "Congestion charge - London", amount: 15.00, daysAgo: 3 },
      { category: "other", description: "Dartford crossing", amount: 5.00, daysAgo: 5 },
      { category: "other", description: "Site access permit fee", amount: 25.00, daysAgo: 8 },
      { category: "fuel", description: "Diesel - Leeds site visit", amount: 78.40, daysAgo: 22 },
      { category: "materials", description: "Sealing gaskets pack", amount: 34.50, daysAgo: 28 },
      { category: "accommodation", description: "Premier Inn Bristol", amount: 95.00, daysAgo: 32 },
      { category: "tools", description: "Fluke multimeter replacement", amount: 189.00, daysAgo: 45 },
      { category: "other", description: "ULEZ charge - London zone", amount: 12.50, daysAgo: 9 },
    ];

    const expenseStatuses = ["approved", "approved", "approved", "pending", "reimbursed"];
    for (let i = 0; i < expenseData.length; i++) {
      const exp = expenseData[i];
      const job = createdJobs[i % createdJobs.length];
      const expDate = new Date();
      expDate.setDate(expDate.getDate() - exp.daysAgo);
      
      const expense = await storage.createExpense({
        userId: TEST_USER_ID,
        jobId: job?.id || null,
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
        date: expDate.toISOString().split('T')[0],
        mileage: exp.mileage || null,
        mileageRate: exp.category === 'mileage' ? 0.45 : null,
        reimbursable: true,
        reimbursed: expenseStatuses[i % expenseStatuses.length] === 'reimbursed',
        status: expenseStatuses[i % expenseStatuses.length],
      });
      createdExpenses.push(expense);
    }
    console.log(`Created ${createdExpenses.length} expenses`);

    // TIMESHEETS - 30+ entries
    const timesheetEntries = [
      { date: 1, start: "08:00", end: "16:30", hours: 8, desc: "Meridian Tower - Annual testing" },
      { date: 1, start: "08:30", end: "17:00", hours: 8, desc: "Northern Quarter - Commissioning" },
      { date: 2, start: "07:30", end: "16:00", hours: 8, desc: "Centenary Building - Damper service" },
      { date: 2, start: "09:00", end: "17:30", hours: 8, desc: "Aire Heights - Stairwell testing" },
      { date: 3, start: "08:00", end: "18:00", hours: 9.5, overtime: 1.5, desc: "Clyde View - Emergency repair" },
      { date: 3, start: "08:00", end: "16:30", hours: 8, desc: "Office - Report writing" },
      { date: 4, start: "07:00", end: "15:30", hours: 8, desc: "Early start - Harbourside Lofts" },
      { date: 4, start: "08:00", end: "16:30", hours: 8, desc: "Client meetings - London" },
      { date: 5, start: "08:30", end: "17:00", hours: 8, desc: "Meridian Tower - Follow-up" },
      { date: 8, start: "08:00", end: "16:30", hours: 8, desc: "Training - Fire safety update" },
      { date: 8, start: "08:00", end: "19:00", hours: 10.5, overtime: 2.5, desc: "Urgent callout - Fan failure" },
      { date: 9, start: "08:00", end: "16:30", hours: 8, desc: "Documentation day" },
      { date: 9, start: "08:30", end: "17:00", hours: 8, desc: "Northern Quarter - Phase 2" },
      { date: 10, start: "07:30", end: "16:00", hours: 8, desc: "Birmingham - Site survey" },
      { date: 10, start: "08:00", end: "16:30", hours: 8, desc: "Equipment maintenance" },
      { date: 11, start: "08:00", end: "17:30", hours: 9, overtime: 1, desc: "Glasgow - Annual service" },
      { date: 11, start: "08:00", end: "16:30", hours: 8, desc: "Quote preparation" },
      { date: 12, start: "08:00", end: "16:30", hours: 8, desc: "Aire Heights - Completion" },
      { date: 15, start: "08:00", end: "16:30", hours: 8, desc: "New project briefing" },
      { date: 15, start: "08:30", end: "17:00", hours: 8, desc: "Centenary - Remedial works" },
      { date: 16, start: "08:00", end: "16:30", hours: 8, desc: "Site handover documentation" },
      { date: 16, start: "07:00", end: "17:00", hours: 9.5, overtime: 1.5, desc: "Long day - Multiple sites" },
      { date: 17, start: "08:00", end: "16:30", hours: 8, desc: "Clyde View - Inspection" },
      { date: 17, start: "08:00", end: "16:30", hours: 8, desc: "Vehicle maintenance day" },
      { date: 18, start: "08:30", end: "17:00", hours: 8, desc: "Leeds - New installation" },
      { date: 18, start: "08:00", end: "16:30", hours: 8, desc: "Admin and invoicing" },
      { date: 19, start: "08:00", end: "16:30", hours: 8, desc: "Bristol - Annual test" },
      { date: 22, start: "08:00", end: "16:30", hours: 8, desc: "Team meeting and planning" },
      { date: 22, start: "08:00", end: "18:00", hours: 9.5, overtime: 1.5, desc: "Urgent - Control panel fault" },
      { date: 23, start: "08:00", end: "16:30", hours: 8, desc: "Standard site work" },
      { date: 23, start: "08:30", end: "17:00", hours: 8, desc: "Follow-up inspections" },
      { date: 24, start: "08:00", end: "16:30", hours: 8, desc: "Certificate preparation" },
    ];

    const timesheetStatuses = ["approved", "approved", "submitted", "pending", "approved"];
    for (let i = 0; i < timesheetEntries.length; i++) {
      const ts = timesheetEntries[i];
      const job = createdJobs[i % createdJobs.length];
      const staff = createdStaff[i % createdStaff.length];
      const tsDate = new Date();
      tsDate.setDate(tsDate.getDate() - ts.date);
      
      const timesheet = await storage.createTimesheet({
        userId: TEST_USER_ID,
        jobId: job?.id || null,
        technicianId: staff?.id || null,
        date: tsDate.toISOString().split('T')[0],
        startTime: ts.start,
        endTime: ts.end,
        breakDuration: 30,
        totalHours: ts.hours,
        hourlyRate: [28, 32, 35, 25][i % 4],
        overtimeHours: ts.overtime || 0,
        overtimeRate: [42, 48, 52.50, 37.50][i % 4],
        description: ts.desc,
        status: timesheetStatuses[i % timesheetStatuses.length],
      });
      createdTimesheets.push(timesheet);
    }
    console.log(`Created ${createdTimesheets.length} timesheets`);

    // MILEAGE CLAIMS - 20+ entries
    const mileageData = [
      { from: "Office - Croydon", to: "Meridian Tower, Canary Wharf", miles: 18, purpose: "Annual testing" },
      { from: "Office - Croydon", to: "Northern Quarter, Manchester", miles: 210, purpose: "Commissioning works" },
      { from: "Home - Bromley", to: "Centenary Building, Birmingham", miles: 125, purpose: "Client meeting" },
      { from: "Office - Croydon", to: "Aire Heights, Leeds", miles: 195, purpose: "Stairwell testing" },
      { from: "Hotel - Glasgow", to: "Clyde View Tower", miles: 8, purpose: "Site attendance" },
      { from: "Office - Croydon", to: "Harbourside Lofts, Bristol", miles: 118, purpose: "Annual service" },
      { from: "Meridian Tower", to: "Office - Croydon", miles: 18, purpose: "Return from site" },
      { from: "Manchester", to: "Office - Croydon", miles: 210, purpose: "Return journey" },
      { from: "Office - Croydon", to: "Westminster client office", miles: 12, purpose: "Quote presentation" },
      { from: "Office - Croydon", to: "Training centre, Reading", miles: 48, purpose: "CPD training" },
      { from: "Reading", to: "Office - Croydon", miles: 48, purpose: "Return from training" },
      { from: "Home - Lewisham", to: "Emergency callout - Stratford", miles: 14, purpose: "Emergency response" },
      { from: "Stratford", to: "Home - Lewisham", miles: 14, purpose: "Return from callout" },
      { from: "Office - Salford", to: "Glasgow Central", miles: 175, purpose: "Scottish project" },
      { from: "Glasgow", to: "Office - Salford", miles: 175, purpose: "Return journey" },
      { from: "Office - Birmingham", to: "Multiple sites - Midlands", miles: 85, purpose: "Multi-site inspection" },
      { from: "Office - Croydon", to: "Heathrow Terminal 5", miles: 22, purpose: "New tender site visit" },
      { from: "Heathrow T5", to: "Office - Croydon", miles: 22, purpose: "Return from tender" },
      { from: "Home - Greenwich", to: "Supplier warehouse - Dartford", miles: 18, purpose: "Equipment collection" },
      { from: "Dartford", to: "Home - Greenwich", miles: 18, purpose: "Return" },
      { from: "Office - Croydon", to: "Victoria, London", miles: 11, purpose: "Client presentation" },
      { from: "Victoria", to: "Office - Croydon", miles: 11, purpose: "Return from meeting" },
    ];

    const mileageStatuses = ["paid", "paid", "approved", "approved", "pending", "pending"];
    for (let i = 0; i < mileageData.length; i++) {
      const m = mileageData[i];
      const job = createdJobs[i % createdJobs.length];
      const claimDate = new Date();
      claimDate.setDate(claimDate.getDate() - (i * 2 + 1));
      
      const totalAmount = m.miles * 0.45;
      
      const claim = await storage.createMileageClaim({
        userId: TEST_USER_ID,
        jobId: job?.id || null,
        claimDate: claimDate.toISOString().split('T')[0],
        startLocation: m.from,
        endLocation: m.to,
        purpose: m.purpose,
        distanceMiles: m.miles,
        ratePerMile: 0.45,
        totalAmount: totalAmount,
        isBusinessMiles: true,
        vehicleType: "car",
        passengerCount: 0,
        passengerRate: 0.05,
        status: mileageStatuses[i % mileageStatuses.length],
        approvedBy: mileageStatuses[i % mileageStatuses.length] !== 'pending' ? 'Operations Director' : null,
        approvedDate: mileageStatuses[i % mileageStatuses.length] !== 'pending' ? claimDate.toISOString().split('T')[0] : null,
        paidDate: mileageStatuses[i % mileageStatuses.length] === 'paid' ? claimDate.toISOString().split('T')[0] : null,
        notes: null,
      });
      createdMileageClaims.push(claim);
    }
    console.log(`Created ${createdMileageClaims.length} mileage claims`);

    // ===== CHECK SHEET TEMPLATES =====
    const createdTemplates: any[] = [];
    
    const templateDefinitions = [
      { systemType: "pressurisation", name: "Stairwell Pressurisation System", description: "Testing template for mechanical stairwell pressurisation systems per BS EN 12101-6" },
      { systemType: "car_park", name: "Car Park Ventilation System", description: "CO monitoring, jet fan, and impulse ventilation testing per BS 7346-7" },
      { systemType: "mshev", name: "Mechanical Smoke Heat Exhaust (MShev)", description: "Testing template for mechanical smoke/heat exhaust ventilation per BS EN 12101-3" },
      { systemType: "aov", name: "Automatic Opening Vent (AOV)", description: "Testing template for AOV systems per BS EN 12101-2" },
      { systemType: "stairwell_pressurisation", name: "Stairwell Differential Pressure", description: "Complete stairwell pressure testing per BS EN 12101-6 with door force measurements" },
      { systemType: "smoke_shaft", name: "Smoke Shaft System", description: "Smoke shaft and lobby ventilation testing per BS EN 12101-6" },
      { systemType: "nshev", name: "Natural Smoke Heat Exhaust (NShev)", description: "Testing template for natural smoke/heat exhaust vents per BS EN 12101-2" },
      { systemType: "compressor", name: "Compressor System", description: "Pneumatic compressor testing including pressure, receiver, and electrical readings" },
      { systemType: "electrical_controls", name: "Electrical Control Panel", description: "Electrical testing for smoke control panels per BS 7346-8 and 18th Edition" },
      { systemType: "fire_damper", name: "Fire Damper Inspection", description: "Fire damper inspection and drop test per BS 9999 and RRO requirements" },
      { systemType: "smoke_fire_curtain", name: "Smoke & Fire Curtain", description: "Smoke curtain and fire curtain testing per BS EN 12101-1 and BS 8524" },
    ];

    // Import the default template fields from schema
    const { DEFAULT_TEMPLATE_FIELDS } = await import("../shared/schema");

    for (const template of templateDefinitions) {
      const fields = DEFAULT_TEMPLATE_FIELDS[template.systemType] || [];
      
      const createdTemplate = await storage.createCheckSheetTemplate({
        userId: TEST_USER_ID,
        name: template.name,
        description: template.description,
        systemType: template.systemType,
        version: "1.0",
        isDefault: true,
        isActive: true,
        fields: fields,
      });
      createdTemplates.push(createdTemplate);
      console.log(`Created check sheet template: ${template.name}`);
    }

    const counts = {
      staff: createdStaff.length,
      clients: createdClients.length,
      contracts: createdContracts.length,
      projects: createdProjects.length,
      jobs: createdJobs.length,
      dampers: createdDampers.length,
      tests: createdTests.length,
      quotes: createdQuotes.length,
      invoices: createdInvoices.length,
      expenses: createdExpenses.length,
      timesheets: createdTimesheets.length,
      mileageClaims: createdMileageClaims.length,
      checkSheetTemplates: createdTemplates.length,
    };

    console.log("Seed complete:", counts);
    return { 
      success: true, 
      message: "Database seeded successfully with comprehensive sample data including financial records",
      counts 
    };
  } catch (error) {
    console.error("Seed error:", error);
    return { 
      success: false, 
      message: `Failed to seed database: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}
