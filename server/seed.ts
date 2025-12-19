// @ts-nocheck
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

    // ===== SITES =====
    const createdSites: any[] = [];
    const createdSiteAssets: any[] = [];
    const SYSTEM_TYPES = ["mshev", "shev", "aov", "pressurisation", "car_park", "smoke_shaft"];
    const ASSET_TYPE_VALUES = ["smoke_damper", "fire_damper", "aov", "exhaust_fan", "supply_fan", "control_panel", "smoke_detector", "pressure_sensor", "louvre", "actuator"];
    
    for (let i = 0; i < BUILDINGS.length; i++) {
      const building = BUILDINGS[i];
      const client = createdClients[i % createdClients.length];
      const systemType = SYSTEM_TYPES[i % SYSTEM_TYPES.length];
      
      const site = await storage.createSite({
        userId: TEST_USER_ID,
        clientId: client.id,
        name: building.name,
        address: building.address,
        postcode: building.postcode,
        city: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Bristol"][i % 6],
        systemType: systemType,
        systemDescription: `${building.floors}-floor ${systemType === "pressurisation" ? "stairwell pressurisation" : systemType === "mshev" ? "mechanical smoke extraction" : "smoke control"} system`,
        accessNotes: `Report to ${["main reception", "security desk", "facilities office"][i % 3]}. Access card required for plant rooms.`,
        parkingInfo: `${["Underground car park - Level B1", "On-street parking with permit", "Loading bay access only", "Multi-storey adjacent"][i % 4]}`,
        siteContactName: ["Building Manager", "Facilities Coordinator", "Security Lead"][i % 3],
        siteContactPhone: `07${String(700 + i).padStart(3, '0')} ${String(100000 + Math.floor(Math.random() * 899999)).padStart(6, '0')}`,
        siteContactEmail: `facilities@${building.name.toLowerCase().replace(/\s+/g, '')}.co.uk`,
        status: "active",
      });
      createdSites.push(site);
      console.log(`Created site: ${site.name}`);

      // Create site assets for each site
      const assetCount = building.dampersPerFloor * Math.min(building.floors, 5);
      for (let a = 0; a < assetCount; a++) {
        const floorNum = Math.floor(a / building.dampersPerFloor) + 1;
        const assetOnFloor = (a % building.dampersPerFloor) + 1;
        const assetType = ASSET_TYPE_VALUES[a % ASSET_TYPE_VALUES.length];
        const assetNumber = `${building.name.substring(0, 3).toUpperCase()}-${assetType.substring(0, 2).toUpperCase()}-${String(a + 1).padStart(3, '0')}`;
        
        const asset = await storage.createSiteAsset({
          userId: TEST_USER_ID,
          siteId: site.id,
          clientId: client.id,
          assetNumber: assetNumber,
          assetType: assetType,
          floor: `Level ${floorNum}`,
          area: ["Stairwell A", "Stairwell B", "Lobby", "Corridor", "Plant Room"][assetOnFloor % 5],
          location: `Floor ${floorNum} - ${["North", "South", "East", "West"][a % 4]} wing`,
          manufacturer: ["Colt", "SE Controls", "Smoke Control Systems", "Brakel", "Kingspan"][a % 5],
          model: `Model ${String.fromCharCode(65 + (a % 5))}${100 + a}`,
          serialNumber: `SN-${new Date().getFullYear()}-${String(a + 1).padStart(6, '0')}`,
          status: ["active", "active", "active", "pending_inspection", "faulty"][a % 5],
          condition: ["good", "good", "fair", "poor", "good"][a % 5],
        });
        createdSiteAssets.push({ ...asset, siteId: site.id });
      }
      console.log(`Created ${assetCount} assets for site: ${site.name}`);
    }

    for (let i = 0; i < BUILDINGS.length; i++) {
      const building = BUILDINGS[i];
      const client = createdClients[i % createdClients.length];
      const site = createdSites[i];
      
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
          siteId: site.id,
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

        // Assign some site assets to this job
        const siteAssetsForJob = createdSiteAssets.filter(a => a.siteId === site.id);
        const assetsToAssign = siteAssetsForJob.slice(0, Math.min(3 + j, siteAssetsForJob.length));
        for (const asset of assetsToAssign) {
          await storage.createJobSiteAsset({
            userId: TEST_USER_ID,
            jobId: job.id,
            siteAssetId: asset.id,
            status: jobStatus === "completed" ? "completed" : jobStatus === "in_progress" ? "in_progress" : "assigned",
            completedBy: jobStatus === "completed" ? assignedEngineer.name : null,
            notes: jobStatus === "completed" ? "Tested and operational" : null,
          });
        }
        if (assetsToAssign.length > 0) {
          console.log(`Assigned ${assetsToAssign.length} assets to job ${job.jobNumber}`);
        }

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

    // ===== VEHICLES =====
    const createdVehicles: any[] = [];
    const vehicleData = [
      { registration: "VN23 ABC", make: "Ford", model: "Transit Custom", type: "Van", mileage: 24500, status: "active" },
      { registration: "VN22 XYZ", make: "Vauxhall", model: "Vivaro", type: "Van", mileage: 38200, status: "active" },
      { registration: "VN21 DEF", make: "Mercedes", model: "Sprinter", type: "Large Van", mileage: 52100, status: "active" },
      { registration: "VN20 GHI", make: "Ford", model: "Transit Connect", type: "Small Van", mileage: 67800, status: "maintenance" },
      { registration: "VN19 JKL", make: "Volkswagen", model: "Caddy", type: "Small Van", mileage: 89400, status: "active" },
    ];

    for (const v of vehicleData) {
      const motDate = new Date();
      motDate.setMonth(motDate.getMonth() + Math.floor(Math.random() * 12));
      const serviceDate = new Date();
      serviceDate.setMonth(serviceDate.getMonth() - Math.floor(Math.random() * 6));
      
      const vehicle = await storage.createVehicle({
        userId: TEST_USER_ID,
        registration: v.registration,
        make: v.make,
        model: v.model,
        vehicleType: v.type,
        fuelType: "diesel",
        currentMileage: v.mileage,
        motExpiry: motDate.toISOString().split('T')[0],
        insuranceExpiry: motDate.toISOString().split('T')[0],
        lastServiceDate: serviceDate.toISOString().split('T')[0],
        nextServiceDue: new Date(serviceDate.setMonth(serviceDate.getMonth() + 6)).toISOString().split('T')[0],
        status: v.status,
      });
      createdVehicles.push(vehicle);
    }
    console.log(`Created ${createdVehicles.length} vehicles`);

    // ===== EQUIPMENT =====
    const createdEquipment: any[] = [];
    const equipmentData = [
      { name: "TSI VelociCalc 9565-P", type: "Anemometer", serial: "AN-2023-001", assetTag: "EQ-001", status: "available" },
      { name: "Testo 440 dP", type: "Differential Pressure Meter", serial: "DPM-2022-015", assetTag: "EQ-002", status: "in_use" },
      { name: "Fluke 179 Multimeter", type: "Electrical Test Equipment", serial: "FLK-2021-089", assetTag: "EQ-003", status: "available" },
      { name: "Smoke Pellet Kit - Large", type: "Smoke Testing Equipment", serial: "SMK-2024-002", assetTag: "EQ-004", status: "available" },
      { name: "AEMC CA 6116 Multifunction", type: "Electrical Test Equipment", serial: "MFT-2023-007", assetTag: "EQ-005", status: "calibration" },
      { name: "Door Force Gauge DF-100", type: "Door Force Meter", serial: "DFG-2022-003", assetTag: "EQ-006", status: "available" },
      { name: "Thermal Imaging Camera FLIR", type: "Thermal Camera", serial: "TIC-2023-001", assetTag: "EQ-007", status: "in_use" },
      { name: "Ladder Set - Triple Extension", type: "Access Equipment", serial: "LAD-2020-012", assetTag: "EQ-008", status: "available" },
    ];

    for (const e of equipmentData) {
      const calibDate = new Date();
      calibDate.setMonth(calibDate.getMonth() + Math.floor(Math.random() * 12));
      
      const equipment = await storage.createEquipment({
        userId: TEST_USER_ID,
        assetTag: e.assetTag,
        name: e.name,
        category: e.type,
        serialNumber: e.serial,
        status: e.status,
        purchaseDate: "2022-01-15",
        purchasePrice: 500 + Math.floor(Math.random() * 2000),
        currentValue: 300 + Math.floor(Math.random() * 1500),
        calibrationDue: calibDate.toISOString().split('T')[0],
        location: ["Van VN23 ABC", "Van VN22 XYZ", "Office Store", "Site - Meridian Tower"][Math.floor(Math.random() * 4)],
      });
      createdEquipment.push(equipment);
    }
    console.log(`Created ${createdEquipment.length} equipment items`);

    // ===== SUPPLIERS =====
    const createdSuppliers: any[] = [];
    const supplierData = [
      { name: "Colt International", contact: "Sales Team", email: "sales@colt-info.co.uk", phone: "01onal 234567", category: "Dampers" },
      { name: "SE Controls Ltd", contact: "Trade Desk", email: "trade@secontrols.com", phone: "01onal 345678", category: "AOV Systems" },
      { name: "Belimo Automation UK", contact: "Orders", email: "orders@belimo.co.uk", phone: "01onal 456789", category: "Actuators" },
      { name: "RS Components", contact: "Trade Account", email: "trade@rs-online.com", phone: "01onal 567890", category: "Electrical" },
      { name: "Screwfix Trade", contact: "Trade Counter", email: "trade@screwfix.com", phone: "01onal 678901", category: "General Supplies" },
      { name: "Toolstation", contact: "Account Manager", email: "accounts@toolstation.com", phone: "01onal 789012", category: "Tools" },
    ];

    for (const s of supplierData) {
      const supplier = await storage.createSupplier({
        userId: TEST_USER_ID,
        name: s.name,
        contactName: s.contact,
        email: s.email,
        phone: s.phone,
        category: s.category,
        status: "active",
        paymentTerms: [30, 30, 14, 0, 0, 0][createdSuppliers.length % 6],
        rating: 4 + Math.floor(Math.random() * 2),
      });
      createdSuppliers.push(supplier);
    }
    console.log(`Created ${createdSuppliers.length} suppliers`);

    // ===== SUBCONTRACTORS =====
    const createdSubcontractors: any[] = [];
    const subcontractorData = [
      { company: "Apex Fire Safety", contact: "John Smith", email: "john@apexfire.co.uk", specialty: "Fire Alarm Systems" },
      { company: "Electrical Solutions UK", contact: "Dave Brown", email: "dave@electricalsolutions.co.uk", specialty: "Electrical Works" },
      { company: "North West Testing Ltd", contact: "Mike Wilson", email: "mike@nwtesting.co.uk", specialty: "Regional Coverage" },
      { company: "Scottish Fire Systems", contact: "Angus MacDonald", email: "angus@scottishfire.co.uk", specialty: "Scotland Region" },
    ];

    for (const s of subcontractorData) {
      const subcontractor = await storage.createSubcontractor({
        userId: TEST_USER_ID,
        companyName: s.company,
        contactName: s.contact,
        email: s.email,
        phone: `07${String(700 + createdSubcontractors.length).padStart(3, '0')} ${String(100000 + Math.floor(Math.random() * 899999))}`,
        specialty: s.specialty,
        status: "approved",
        dayRate: 250 + Math.floor(Math.random() * 150),
        insuranceExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      createdSubcontractors.push(subcontractor);
    }
    console.log(`Created ${createdSubcontractors.length} subcontractors`);

    // ===== PURCHASE ORDERS =====
    const createdPurchaseOrders: any[] = [];
    const poData = [
      { title: "Replacement Actuators x 5", supplier: 0, amount: 1250, status: "received" },
      { title: "Smoke Pellets - Quarterly Order", supplier: 4, amount: 450, status: "ordered" },
      { title: "Cable and Connectors", supplier: 3, amount: 280, status: "received" },
      { title: "PPE Equipment", supplier: 4, amount: 320, status: "pending" },
      { title: "Damper Blades - Emergency", supplier: 0, amount: 890, status: "received" },
    ];

    for (let i = 0; i < poData.length; i++) {
      const p = poData[i];
      const poDate = new Date();
      poDate.setDate(poDate.getDate() - (i * 7));
      
      const po = await storage.createPurchaseOrder({
        userId: TEST_USER_ID,
        poNumber: `PO-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
        supplierId: createdSuppliers[p.supplier]?.id || null,
        title: p.title,
        description: `Purchase order for ${p.title.toLowerCase()}`,
        lineItems: [{ id: `po-line-${i}`, description: p.title, quantity: 1, unitPrice: p.amount, total: p.amount }],
        subtotal: p.amount,
        vatAmount: p.amount * 0.2,
        total: p.amount * 1.2,
        status: p.status,
        orderDate: poDate.toISOString().split('T')[0],
      });
      createdPurchaseOrders.push(po);
    }
    console.log(`Created ${createdPurchaseOrders.length} purchase orders`);

    // ===== INVENTORY =====
    const createdInventory: any[] = [];
    const inventoryData = [
      { name: "Smoke Pellets (Box of 50)", partNumber: "SMK-001", quantity: 120, reorder: 50, category: "consumables" },
      { name: "Belimo Actuator NM24A", partNumber: "ACT-BEL-001", quantity: 8, reorder: 5, category: "actuators" },
      { name: "Cable Ties 200mm (Pack)", partNumber: "CAB-CT-200", quantity: 45, reorder: 20, category: "fixings" },
      { name: "Gasket Seals Assorted", partNumber: "GAS-AST-001", quantity: 30, reorder: 15, category: "fixings" },
      { name: "Fuses 3A (Pack of 10)", partNumber: "FUS-3A-10", quantity: 25, reorder: 10, category: "consumables" },
      { name: "Safety Glasses", partNumber: "PPE-SG-001", quantity: 18, reorder: 10, category: "consumables" },
      { name: "Hard Hat - White", partNumber: "PPE-HH-WHT", quantity: 12, reorder: 6, category: "consumables" },
      { name: "Hi-Vis Vest XL", partNumber: "PPE-HV-XL", quantity: 15, reorder: 8, category: "consumables" },
    ];

    for (const inv of inventoryData) {
      const item = await storage.createInventoryItem({
        userId: TEST_USER_ID,
        itemName: inv.name,
        partNumber: inv.partNumber,
        category: inv.category,
        quantityInStock: inv.quantity,
        minimumStock: inv.reorder,
        unitCost: 5 + Math.floor(Math.random() * 50),
        location: ["warehouse", "van", "warehouse"][Math.floor(Math.random() * 3)],
      });
      createdInventory.push(item);
    }
    console.log(`Created ${createdInventory.length} inventory items`);

    // ===== PARTS CATALOG =====
    const createdParts: any[] = [];
    const partsData = [
      { name: "Smoke Damper 300x300mm", partNumber: "SD-300-300", category: "Dampers", price: 185 },
      { name: "Smoke Damper 400x400mm", partNumber: "SD-400-400", category: "Dampers", price: 225 },
      { name: "Fire Damper 300x300mm", partNumber: "FD-300-300", category: "Dampers", price: 145 },
      { name: "Belimo NM24A Actuator", partNumber: "ACT-NM24A", category: "Actuators", price: 89 },
      { name: "Belimo NM230A Actuator", partNumber: "ACT-NM230A", category: "Actuators", price: 95 },
      { name: "Control Panel - 4 Zone", partNumber: "CP-4Z", category: "Controls", price: 450 },
      { name: "Pressure Sensor 0-100Pa", partNumber: "PS-100", category: "Sensors", price: 125 },
      { name: "Smoke Detector Head", partNumber: "SD-HEAD", category: "Sensors", price: 45 },
    ];

    for (const p of partsData) {
      const part = await storage.createPart({
        userId: TEST_USER_ID,
        name: p.name,
        partNumber: p.partNumber,
        category: p.category,
        description: `${p.name} - standard specification`,
        unitPrice: p.price,
        costPrice: p.price * 0.6,
        supplier: ["Colt", "SE Controls", "Belimo"][Math.floor(Math.random() * 3)],
        leadTime: [3, 5, 7, 14][Math.floor(Math.random() * 4)],
        status: "active",
      });
      createdParts.push(part);
    }
    console.log(`Created ${createdParts.length} parts`);

    // ===== PRICE LISTS =====
    const createdPriceLists: any[] = [];
    const priceListData = [
      { name: "Standard Labour Rate", category: "labour", unit: "hour", sellPrice: 65, costPrice: 45 },
      { name: "Senior Engineer Rate", category: "labour", unit: "hour", sellPrice: 85, costPrice: 55 },
      { name: "Emergency Call-Out", category: "call_out", unit: "each", sellPrice: 250, costPrice: 150 },
      { name: "Out of Hours Premium", category: "service", unit: "hour", sellPrice: 45, costPrice: 25 },
      { name: "Annual Damper Test", category: "service", unit: "each", sellPrice: 35, costPrice: 20 },
      { name: "Stairwell Pressure Test", category: "service", unit: "each", sellPrice: 450, costPrice: 280 },
      { name: "System Commissioning", category: "service", unit: "day", sellPrice: 650, costPrice: 400 },
      { name: "Report Writing", category: "service", unit: "hour", sellPrice: 55, costPrice: 35 },
    ];

    for (const pl of priceListData) {
      const priceList = await storage.createPriceList({
        userId: TEST_USER_ID,
        name: pl.name,
        category: pl.category,
        unit: pl.unit,
        sellPrice: pl.sellPrice,
        costPrice: pl.costPrice,
        effectiveFrom: "2024-01-01",
        isActive: true,
      });
      createdPriceLists.push(priceList);
    }
    console.log(`Created ${createdPriceLists.length} price list items`);

    // ===== LEADS =====
    const createdLeads: any[] = [];
    const leadData = [
      { company: "Tower Bridge Estates", contact: "Richard Hall", source: "Website", value: 15000, status: "qualified" },
      { company: "Canary Developments Ltd", contact: "Sarah Chen", source: "Referral", value: 28000, status: "proposal" },
      { company: "Manchester Central Properties", contact: "James Murphy", source: "Trade Show", value: 12000, status: "new" },
      { company: "Edinburgh Castle Trust", contact: "Fiona Stewart", source: "Cold Call", value: 8500, status: "contacted" },
      { company: "Bristol Waterfront Ltd", contact: "Andrew Thomas", source: "LinkedIn", value: 22000, status: "qualified" },
    ];

    for (const l of leadData) {
      const lead = await storage.createLead({
        userId: TEST_USER_ID,
        companyName: l.company,
        contactName: l.contact,
        email: `${l.contact.split(' ')[0].toLowerCase()}@${l.company.toLowerCase().replace(/\s+/g, '')}.co.uk`,
        phone: `07${String(700 + createdLeads.length).padStart(3, '0')} ${String(100000 + Math.floor(Math.random() * 899999))}`,
        source: l.source,
        estimatedValue: l.value,
        status: l.status,
        notes: `Initial enquiry about smoke control services. ${l.source} lead.`,
      });
      createdLeads.push(lead);
    }
    console.log(`Created ${createdLeads.length} leads`);

    // ===== TENDERS =====
    const createdTenders: any[] = [];
    const tenderData = [
      { title: "Olympic Park Residential Block A", issuer: "Olympic Delivery Authority", value: 85000, status: "submitted" },
      { title: "NHS Hospital Trust - Annual Contract", issuer: "NHS Property Services", value: 42000, status: "submitted" },
      { title: "University Campus Smoke Systems", issuer: "University of London", value: 65000, status: "preparing" },
      { title: "Shopping Centre Refurbishment", issuer: "Westfield Properties", value: 120000, status: "won" },
    ];

    for (let i = 0; i < tenderData.length; i++) {
      const t = tenderData[i];
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + (14 + i * 7));
      
      const tender = await storage.createTender({
        userId: TEST_USER_ID,
        tenderNumber: `TEN-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
        title: t.title,
        issuer: t.issuer,
        description: `Tender for ${t.title.toLowerCase()} - smoke control installation and maintenance`,
        contractValue: t.value,
        submissionDeadline: deadline.toISOString().split('T')[0],
        status: t.status,
      });
      createdTenders.push(tender);
    }
    console.log(`Created ${createdTenders.length} tenders`);

    // ===== COMPETITORS =====
    const createdCompetitors: any[] = [];
    const competitorData = [
      { name: "Smoke Control Systems Ltd", website: "www.smokecontrolsystems.co.uk", strength: "Large workforce" },
      { name: "Fire Safety Solutions", website: "www.firesafetysolutions.co.uk", strength: "National coverage" },
      { name: "Colt Service Division", website: "www.coltinfo.co.uk", strength: "OEM backing" },
      { name: "Regional Ventilation Services", website: "www.rvs.co.uk", strength: "Price competitive" },
    ];

    for (const c of competitorData) {
      const competitor = await storage.createCompetitor({
        userId: TEST_USER_ID,
        companyName: c.name,
        website: c.website,
        keyStrengths: c.strength,
        keyWeaknesses: "Limited technical depth",
        marketPosition: ["direct", "indirect", "potential"][Math.floor(Math.random() * 3)],
        notes: `Key competitor in smoke control market. ${c.strength}.`,
      });
      createdCompetitors.push(competitor);
    }
    console.log(`Created ${createdCompetitors.length} competitors`);

    // ===== DEFECTS =====
    const createdDefects: any[] = [];
    const defectData = [
      { title: "Damper blade stuck - Floor 12", severity: "high", status: "open", category: "damper" },
      { title: "Actuator not responding", severity: "medium", status: "in_progress", category: "actuator" },
      { title: "Smoke detector false alarms", severity: "high", status: "resolved", category: "controls" },
      { title: "Control panel display fault", severity: "low", status: "open", category: "controls" },
      { title: "Pressure readings inconsistent", severity: "medium", status: "closed", category: "other" },
    ];

    for (let i = 0; i < defectData.length; i++) {
      const d = defectData[i];
      const defect = await storage.createDefect({
        userId: TEST_USER_ID,
        defectNumber: `DEF-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
        jobId: createdJobs[i % createdJobs.length]?.id || null,
        clientId: createdClients[i % createdClients.length]?.id || null,
        description: `${d.title} - Defect identified during routine inspection`,
        category: d.category,
        severity: d.severity,
        status: d.status,
        discoveredBy: STAFF_MEMBERS[i % STAFF_MEMBERS.length].firstName + " " + STAFF_MEMBERS[i % STAFF_MEMBERS.length].lastName,
        discoveredDate: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      createdDefects.push(defect);
    }
    console.log(`Created ${createdDefects.length} defects`);

    // ===== INCIDENTS =====
    const createdIncidents: any[] = [];
    const incidentData = [
      { title: "Near miss - Ladder slip", type: "near_miss", severity: "low" },
      { title: "Minor cut from cable", type: "accident", severity: "low" },
      { title: "Vehicle minor damage", type: "damage", severity: "medium" },
    ];

    for (let i = 0; i < incidentData.length; i++) {
      const inc = incidentData[i];
      const site = createdSites[i % createdSites.length];
      const incident = await storage.createIncident({
        userId: TEST_USER_ID,
        jobId: createdJobs[i % createdJobs.length]?.id || null,
        location: site?.name || "Office",
        type: inc.type,
        description: `Incident report: ${inc.title}. No serious injuries.`,
        severity: inc.severity,
        status: "closed",
        incidentDate: new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        correctiveActions: "Reviewed safety procedures. Additional training provided.",
      });
      createdIncidents.push(incident);
    }
    console.log(`Created ${createdIncidents.length} incidents`);

    // ===== RISK ASSESSMENTS =====
    const createdRiskAssessments: any[] = [];
    for (let i = 0; i < Math.min(createdSites.length, 4); i++) {
      const site = createdSites[i];
      const ra = await storage.createRiskAssessment({
        userId: TEST_USER_ID,
        jobId: createdJobs[i % createdJobs.length]?.id || null,
        title: `Risk Assessment - ${site.name}`,
        siteAddress: site.address,
        assessedBy: STAFF_MEMBERS[0].firstName + " " + STAFF_MEMBERS[0].lastName,
        assessmentDate: new Date(Date.now() - i * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        hazards: [
          { id: "h1", hazard: "Working at height", whoAtRisk: "Engineers", initialRisk: "High", controls: "Use of access equipment", residualRisk: "Low" },
          { id: "h2", hazard: "Electrical hazards", whoAtRisk: "Engineers", initialRisk: "Medium", controls: "Lock-out procedures", residualRisk: "Low" },
          { id: "h3", hazard: "Manual handling", whoAtRisk: "All staff", initialRisk: "Medium", controls: "Lifting aids provided", residualRisk: "Low" },
        ],
        ppe: ["Hard hat", "Hi-vis vest", "Safety boots", "Safety glasses"],
        methodStatement: "Standard smoke control testing methodology",
      });
      createdRiskAssessments.push(ra);
    }
    console.log(`Created ${createdRiskAssessments.length} risk assessments`);

    // ===== TRAINING RECORDS =====
    const createdTrainingRecords: any[] = [];
    const trainingData = [
      { course: "BSRIA Commissioning Certificate", provider: "BSRIA", courseType: "external" },
      { course: "Working at Heights Refresher", provider: "SafetyFirst Training", courseType: "practical" },
      { course: "18th Edition Wiring Regulations", provider: "ECA", courseType: "external" },
      { course: "First Aid at Work Renewal", provider: "St John Ambulance", courseType: "practical" },
      { course: "Fire Safety Awareness", provider: "In-house", courseType: "internal" },
    ];

    for (let i = 0; i < createdStaff.length && i < 5; i++) {
      const staff = createdStaff[i];
      const t = trainingData[i % trainingData.length];
      const completedDate = new Date();
      completedDate.setMonth(completedDate.getMonth() - Math.floor(Math.random() * 12));
      const expiryDate = new Date(completedDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 3);
      
      const training = await storage.createTrainingRecord({
        userId: TEST_USER_ID,
        employeeName: staff.firstName + " " + staff.lastName,
        employeeId: staff.id,
        courseName: t.course,
        courseType: t.courseType,
        provider: t.provider,
        completedDate: completedDate.toISOString().split('T')[0],
        expiryDate: expiryDate.toISOString().split('T')[0],
        status: "completed",
        certificateNumber: `CERT-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
      });
      createdTrainingRecords.push(training);
    }
    console.log(`Created ${createdTrainingRecords.length} training records`);

    // ===== CERTIFICATIONS =====
    const createdCertifications: any[] = [];
    const certData = [
      { name: "CSCS Gold Card", issuer: "CSCS", type: "cscs" },
      { name: "ECS Card - Installation Electrician", issuer: "JIB", type: "electrical" },
      { name: "IPAF Operator Licence", issuer: "IPAF", type: "ipaf" },
      { name: "PASMA Certificate", issuer: "PASMA", type: "pasma" },
    ];

    for (let i = 0; i < createdStaff.length && i < 4; i++) {
      const staff = createdStaff[i];
      const c = certData[i % certData.length];
      const issueDate = new Date();
      issueDate.setFullYear(issueDate.getFullYear() - 1);
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 4);
      
      const cert = await storage.createCertification({
        userId: TEST_USER_ID,
        technicianId: staff.id,
        technicianName: staff.firstName + " " + staff.lastName,
        certificationName: c.name,
        issuingBody: c.issuer,
        certificationType: c.type,
        issueDate: issueDate.toISOString().split('T')[0],
        expiryDate: expiryDate.toISOString().split('T')[0],
        status: "valid",
        certificateNumber: `${c.issuer.substring(0, 3).toUpperCase()}-${String(100000 + i)}`,
      });
      createdCertifications.push(cert);
    }
    console.log(`Created ${createdCertifications.length} certifications`);

    // ===== TIME OFF REQUESTS =====
    const createdTimeOffRequests: any[] = [];
    const timeOffData = [
      { type: "annual_leave", days: 5, status: "approved" },
      { type: "annual_leave", days: 3, status: "pending" },
      { type: "sick_leave", days: 2, status: "approved" },
      { type: "training", days: 1, status: "approved" },
    ];

    for (let i = 0; i < Math.min(createdStaff.length, 4); i++) {
      const staff = createdStaff[i];
      const t = timeOffData[i];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + (i * 7) + 7);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + t.days - 1);
      
      const request = await storage.createTimeOffRequest({
        userId: TEST_USER_ID,
        employeeName: staff.firstName + " " + staff.lastName,
        employeeId: staff.id,
        requestType: t.type,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalDays: t.days,
        reason: `${t.type.replace('_', ' ')} request`,
        status: t.status,
      });
      createdTimeOffRequests.push(request);
    }
    console.log(`Created ${createdTimeOffRequests.length} time off requests`);

    // ===== JOB TEMPLATES =====
    const createdJobTemplates: any[] = [];
    const jobTemplateData = [
      { name: "Annual Damper Testing", type: "testing", duration: 4, description: "Standard annual velocity testing of smoke dampers" },
      { name: "Stairwell Pressurisation Test", type: "testing", duration: 6, description: "Full stairwell differential pressure testing per BS EN 12101-6" },
      { name: "Emergency Call-Out", type: "repair", duration: 2, description: "Reactive call-out for system faults" },
      { name: "Damper Installation", type: "installation", duration: 8, description: "New damper installation including commissioning" },
      { name: "Quarterly Maintenance", type: "maintenance", duration: 3, description: "Quarterly preventive maintenance visit" },
    ];

    for (const jt of jobTemplateData) {
      const template = await storage.createJobTemplate({
        userId: TEST_USER_ID,
        name: jt.name,
        description: jt.description,
        jobType: jt.type,
        estimatedDuration: jt.duration,
        checklist: [
          { id: "1", item: "Safety briefing", required: true },
          { id: "2", item: "Equipment check", required: true },
          { id: "3", item: "Testing", required: true },
          { id: "4", item: "Documentation", required: true },
          { id: "5", item: "Client sign-off", required: false },
        ],
      });
      createdJobTemplates.push(template);
    }
    console.log(`Created ${createdJobTemplates.length} job templates`);

    // ===== RECURRING JOBS =====
    const createdRecurringJobs: any[] = [];
    for (let i = 0; i < Math.min(createdClients.length, 3); i++) {
      const client = createdClients[i];
      const site = createdSites[i];
      const contract = createdContracts[i % createdContracts.length];
      
      const recurring = await storage.createRecurringJob({
        userId: TEST_USER_ID,
        clientId: client.id,
        contractId: contract?.id || null,
        templateId: createdJobTemplates[0]?.id || null,
        name: `Annual Maintenance - ${site.name}`,
        description: "Scheduled annual maintenance and testing",
        serviceType: "damper_testing",
        frequency: "annually",
        startDate: new Date().toISOString().split('T')[0],
        nextDueDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        siteAddress: site.address,
        isActive: true,
      });
      createdRecurringJobs.push(recurring);
    }
    console.log(`Created ${createdRecurringJobs.length} recurring jobs`);

    // ===== WORK NOTES =====
    const createdWorkNotes: any[] = [];
    for (let i = 0; i < Math.min(createdJobs.length, 5); i++) {
      const job = createdJobs[i];
      const note = await storage.createWorkNote({
        userId: TEST_USER_ID,
        jobId: job.id,
        noteDate: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        content: `${["Arrived on site at 08:30.", "Completed initial inspection.", "All dampers tested successfully.", "Minor issue found with actuator on Floor 3.", "Client signed off completion."][i]}`,
        authorName: STAFF_MEMBERS[i % STAFF_MEMBERS.length].firstName + " " + STAFF_MEMBERS[i % STAFF_MEMBERS.length].lastName,
        noteType: ["site_visit", "general", "general", "issue", "general"][i],
      });
      createdWorkNotes.push(note);
    }
    console.log(`Created ${createdWorkNotes.length} work notes`);

    // ===== CALLBACKS =====
    const createdCallbacks: any[] = [];
    const callbackData = [
      { reason: "Damper not closing fully", priority: "high", status: "pending", category: "emergency" },
      { reason: "Follow-up from annual test", priority: "normal", status: "pending", category: "general" },
      { reason: "Client query about readings", priority: "low", status: "completed", category: "general" },
    ];

    for (let i = 0; i < callbackData.length; i++) {
      const cb = callbackData[i];
      const client = createdClients[i % createdClients.length];
      const callback = await storage.createCallback({
        userId: TEST_USER_ID,
        clientId: client?.id,
        jobId: createdJobs[i % createdJobs.length]?.id,
        contactName: client?.contactPerson || "Site Manager",
        contactPhone: client?.phone || "07700 900000",
        reason: cb.reason,
        category: cb.category,
        priority: cb.priority,
        status: cb.status,
        requestedDate: new Date(Date.now() + (i + 1) * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `Callback required: ${cb.reason}`,
      });
      createdCallbacks.push(callback);
    }
    console.log(`Created ${createdCallbacks.length} callbacks`);

    // ===== SLAs =====
    const createdSLAs: any[] = [];
    const slaData = [
      { name: "Standard Response", responseHours: 24, resolutionHours: 72, priority: "standard" },
      { name: "Priority Response", responseHours: 8, resolutionHours: 24, priority: "high" },
      { name: "Emergency Response", responseHours: 4, resolutionHours: 8, priority: "emergency" },
    ];

    for (const s of slaData) {
      const sla = await storage.createSLA({
        userId: TEST_USER_ID,
        name: s.name,
        description: `${s.name} SLA - ${s.responseHours}hr response, ${s.resolutionHours}hr resolution`,
        responseTimeHours: s.responseHours,
        resolutionTimeHours: s.resolutionHours,
        priority: s.priority,
        status: "active",
      });
      createdSLAs.push(sla);
    }
    console.log(`Created ${createdSLAs.length} SLAs`);

    // ===== CUSTOMER FEEDBACK =====
    const createdFeedback: any[] = [];
    const feedbackData = [
      { rating: 5, summary: "Excellent service, very professional team", type: "positive" },
      { rating: 4, summary: "Good work, completed on time", type: "positive" },
      { rating: 5, summary: "Very thorough testing and clear documentation", type: "positive" },
      { rating: 3, summary: "Work was fine but communication could improve", type: "neutral" },
    ];

    for (let i = 0; i < feedbackData.length; i++) {
      const f = feedbackData[i];
      const feedback = await storage.createCustomerFeedback({
        userId: TEST_USER_ID,
        clientId: createdClients[i % createdClients.length]?.id,
        jobId: createdJobs[i % createdJobs.length]?.id,
        rating: f.rating,
        summary: f.summary,
        feedbackType: f.type,
        feedbackDate: new Date(Date.now() - i * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      createdFeedback.push(feedback);
    }
    console.log(`Created ${createdFeedback.length} customer feedback entries`);

    // ===== DOCUMENT TEMPLATES =====
    const createdDocTemplates: any[] = [];
    const docTemplateData = [
      { name: "Damper Test Certificate", templateType: "certificate", description: "Standard damper velocity test certificate" },
      { name: "Pressurisation Test Report", templateType: "report", description: "Stairwell pressurisation test report template" },
      { name: "Service Report", templateType: "report", description: "General service visit report" },
      { name: "Defect Notice", templateType: "letter", description: "Defect notification to client" },
      { name: "Quotation Letter", templateType: "quote", description: "Standard quotation cover letter" },
    ];

    for (const dt of docTemplateData) {
      const template = await storage.createDocumentTemplate({
        userId: TEST_USER_ID,
        name: dt.name,
        templateType: dt.templateType,
        description: dt.description,
        content: `Template content for ${dt.name}`,
        isActive: true,
      });
      createdDocTemplates.push(template);
    }
    console.log(`Created ${createdDocTemplates.length} document templates`);

    // ===== VISIT TYPES =====
    const createdVisitTypes: any[] = [];
    const visitTypeData = [
      { name: "NSHEV Testing", code: "nshev", category: "smoke_control" },
      { name: "MSHEV Testing", code: "mshev", category: "smoke_control" },
      { name: "Pressurisation System", code: "pressurisation", category: "smoke_control" },
      { name: "Residential AOV", code: "residential_aov", category: "smoke_control" },
      { name: "Car Park Ventilation", code: "car_park", category: "ventilation" },
    ];

    for (const vt of visitTypeData) {
      const visitType = await storage.createVisitType({
        userId: TEST_USER_ID,
        name: vt.name,
        code: vt.code,
        category: vt.category,
        description: `${vt.name} inspection and testing`,
        isActive: true,
      });
      createdVisitTypes.push(visitType);
    }
    console.log(`Created ${createdVisitTypes.length} visit types`);

    // ===== WARRANTIES =====
    const createdWarranties: any[] = [];
    for (let i = 0; i < Math.min(createdClients.length, 5); i++) {
      const client = createdClients[i];
      const installDate = new Date();
      installDate.setFullYear(installDate.getFullYear() - 1);
      const startDate = new Date(installDate);
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      const warranty = await storage.createWarranty({
        userId: TEST_USER_ID,
        clientId: client.id,
        equipmentDescription: ["Smoke Damper SD-100", "Control Panel CP-500", "Actuator ACT-24V", "AOV Unit Type A", "Compressor Unit"][i],
        manufacturer: ["Colt", "SE Controls", "Belimo", "Window Master", "Axair"][i],
        installationDate: installDate.toISOString().split('T')[0],
        warrantyStartDate: startDate.toISOString().split('T')[0],
        warrantyEndDate: endDate.toISOString().split('T')[0],
        warrantyType: "manufacturer",
        warrantyProvider: ["Colt", "SE Controls", "Belimo", "Window Master", "Axair"][i],
        coverageDetails: "Standard manufacturer warranty - parts and labour",
        status: "active",
      });
      createdWarranties.push(warranty);
    }
    console.log(`Created ${createdWarranties.length} warranties`);

    // ===== SERVICE HISTORY =====
    const createdServiceHistory: any[] = [];
    for (let i = 0; i < Math.min(createdClients.length, 4); i++) {
      const client = createdClients[i];
      for (let j = 0; j < 3; j++) {
        const serviceDate = new Date();
        serviceDate.setMonth(serviceDate.getMonth() - (j * 4));
        
        const history = await storage.createServiceHistory({
          userId: TEST_USER_ID,
          clientId: client.id,
          jobId: createdJobs[(i + j) % createdJobs.length]?.id || null,
          serviceDate: serviceDate.toISOString().split('T')[0],
          serviceType: ["maintenance", "inspection", "repair"][j % 3],
          description: `${["Annual maintenance", "Quarterly inspection", "Reactive repair"][j % 3]} completed for ${client.name}`,
          technicianName: STAFF_MEMBERS[j % STAFF_MEMBERS.length].firstName + " " + STAFF_MEMBERS[j % STAFF_MEMBERS.length].lastName,
          outcome: "completed",
          nextServiceDue: new Date(serviceDate.setMonth(serviceDate.getMonth() + 12)).toISOString().split('T')[0],
        });
        createdServiceHistory.push(history);
      }
    }
    console.log(`Created ${createdServiceHistory.length} service history entries`);

    // ===== SITE ACCESS NOTES =====
    const createdSiteAccessNotes: any[] = [];
    for (let i = 0; i < Math.min(createdClients.length, createdSites.length); i++) {
      const site = createdSites[i];
      const client = createdClients[i % createdClients.length];
      const note = await storage.createSiteAccessNote({
        userId: TEST_USER_ID,
        clientId: client.id,
        siteName: site.name,
        siteAddress: site.address,
        parkingInstructions: ["Visitor parking on level -1", "Street parking only - pay & display", "Report to security for parking permit", "Free parking in rear car park"][i % 4],
        accessCode: `#${1000 + i * 111}`,
        buildingManagerName: ["John Smith", "Sarah Johnson", "Mike Williams", "Emma Brown"][i % 4],
        buildingManagerPhone: `07700 90000${i}`,
        accessHours: "Monday-Friday 08:00-18:00",
        specialRequirements: `${["Report to main reception on arrival.", "Security will escort to plant room.", "Access card required - collect from facilities.", "Out of hours access via key safe."][i % 4]}`,
      });
      createdSiteAccessNotes.push(note);
    }
    console.log(`Created ${createdSiteAccessNotes.length} site access notes`);

    const counts = {
      staff: createdStaff.length,
      clients: createdClients.length,
      sites: createdSites.length,
      siteAssets: createdSiteAssets.length,
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
      vehicles: createdVehicles.length,
      equipment: createdEquipment.length,
      suppliers: createdSuppliers.length,
      subcontractors: createdSubcontractors.length,
      purchaseOrders: createdPurchaseOrders.length,
      inventory: createdInventory.length,
      parts: createdParts.length,
      priceLists: createdPriceLists.length,
      leads: createdLeads.length,
      tenders: createdTenders.length,
      competitors: createdCompetitors.length,
      defects: createdDefects.length,
      incidents: createdIncidents.length,
      riskAssessments: createdRiskAssessments.length,
      trainingRecords: createdTrainingRecords.length,
      certifications: createdCertifications.length,
      timeOffRequests: createdTimeOffRequests.length,
      jobTemplates: createdJobTemplates.length,
      recurringJobs: createdRecurringJobs.length,
      workNotes: createdWorkNotes.length,
      callbacks: createdCallbacks.length,
      slas: createdSLAs.length,
      customerFeedback: createdFeedback.length,
      documentTemplates: createdDocTemplates.length,
      visitTypes: createdVisitTypes.length,
      warranties: createdWarranties.length,
      serviceHistory: createdServiceHistory.length,
      siteAccessNotes: createdSiteAccessNotes.length,
    };

    console.log("Seed complete:", counts);
    return { 
      success: true, 
      message: "Database seeded successfully with comprehensive sample data for all areas",
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

// Run seeder when script is executed directly
const isMainModule = process.argv[1]?.includes('seed');
if (isMainModule) {
  seedDatabase().then(result => {
    console.log(result.message);
    if (result.counts) {
      console.log("Counts:", result.counts);
    }
    process.exit(result.success ? 0 : 1);
  });
}
