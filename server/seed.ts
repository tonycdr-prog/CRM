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

    const counts = {
      clients: createdClients.length,
      contracts: createdContracts.length,
      projects: createdProjects.length,
      jobs: createdJobs.length,
      dampers: createdDampers.length,
      tests: createdTests.length,
    };

    console.log("Seed complete:", counts);
    return { 
      success: true, 
      message: "Database seeded successfully with sample data",
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
