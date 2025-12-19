import { Test, Damper, Report, StairwellPressureTest, Project, DamperTemplate, damperSchema, reportSchema, testSchema, stairwellPressureTestSchema, projectSchema, damperTemplateSchema } from "@shared/schema";
import { nanoid } from "nanoid";

const STORAGE_VERSION = 5;
const STORAGE_KEY = "airflow-data";
const LEGACY_STORAGE_KEY = "airflow-tests";

export interface StorageData {
  version: number;
  tests: Record<string, Test>;
  dampers: Record<string, Damper>;
  reports: Record<string, Partial<Report>>;
  stairwellTests: Record<string, StairwellPressureTest>;
  projects: Record<string, Project>;
  damperTemplates: Record<string, DamperTemplate>;
  damperReportSettings?: Partial<Report>;
  stairwellReportSettings?: Partial<Report>;
  lastUpdated: number;
}

/**
 * Generate a unique damper key from building, location, floor, and shaftId
 * Including floor number ensures each floor is tracked separately for trend analysis
 */
export function generateDamperKey(building: string, location: string, floorNumber: string, shaftId: string): string {
  return `${building.trim().toLowerCase()}_${location.trim().toLowerCase()}_${floorNumber.trim().toLowerCase()}_${shaftId.trim().toLowerCase()}`;
}

/**
 * Get or create a damper entity for a test
 */
export function getOrCreateDamper(
  test: Test,
  dampers: Record<string, Damper>
): Damper {
  const damperKey = generateDamperKey(test.building, test.location, test.floorNumber, test.shaftId);
  
  // Check if damper already exists
  const existing = Object.values(dampers).find(d => d.damperKey === damperKey);
  if (existing) {
    return existing;
  }
  
  // Create new damper
  const newDamper: Damper = {
    id: nanoid(),
    damperKey,
    building: test.building,
    location: test.location,
    floorNumber: test.floorNumber,
    shaftId: test.shaftId,
    systemType: test.systemType,
    description: `${test.location}, Floor ${test.floorNumber}, Shaft ${test.shaftId}`,
    createdAt: test.createdAt,
  };
  
  return newDamper;
}

/**
 * Initialize storage with default structure
 */
function initializeStorage(): StorageData {
  return {
    version: STORAGE_VERSION,
    tests: {},
    dampers: {},
    reports: {},
    stairwellTests: {},
    projects: {},
    damperTemplates: {},
    lastUpdated: Date.now(),
  };
}

/**
 * Migrate legacy test array to new structure
 */
function migrateLegacyData(legacyTests: Test[]): StorageData {
  const data = initializeStorage();
  const damperMap = new Map<string, Damper>();
  
  legacyTests.forEach(test => {
    // Get or create damper
    const damper = getOrCreateDamper(test, Object.fromEntries(damperMap));
    damperMap.set(damper.id, damper);
    
    // Update test with damperId
    const updatedTest: Test = {
      ...test,
      damperId: damper.id,
    };
    
    data.tests[test.id] = updatedTest;
  });
  
  // Add all dampers to storage
  damperMap.forEach((damper, id) => {
    data.dampers[id] = damper;
  });
  
  // Initialize empty stairwell tests
  data.stairwellTests = {};
  
  return data;
}

/**
 * Migrate from version 2 to version 3
 * Updates damper keys to include floor number for floor-level trend tracking
 */
function migrateV2ToV3(data: StorageData): StorageData {
  console.log('Migrating dampers to include floor number in key');
  
  // Rebuild dampers with new keys that include floor number
  const newDampers: Record<string, Damper> = {};
  const damperIdMapping = new Map<string, string>(); // old damperId -> new damperId
  
  // Group tests by the new damper key (building+location+floor+shaft)
  const testsByNewKey = new Map<string, Test[]>();
  
  Object.values(data.tests).forEach(test => {
    const newKey = generateDamperKey(test.building, test.location, test.floorNumber, test.shaftId);
    if (!testsByNewKey.has(newKey)) {
      testsByNewKey.set(newKey, []);
    }
    testsByNewKey.get(newKey)!.push(test);
  });
  
  // Create new dampers for each unique key
  testsByNewKey.forEach((tests, newKey) => {
    const firstTest = tests[0];
    const newDamper: Damper = {
      id: nanoid(),
      damperKey: newKey,
      building: firstTest.building,
      location: firstTest.location,
      floorNumber: firstTest.floorNumber,
      shaftId: firstTest.shaftId,
      systemType: firstTest.systemType,
      description: `${firstTest.location}, Floor ${firstTest.floorNumber}, Shaft ${firstTest.shaftId}`,
      createdAt: Math.min(...tests.map(t => t.createdAt)),
    };
    
    newDampers[newDamper.id] = newDamper;
    
    // Map all old damper IDs from these tests to the new damper ID
    tests.forEach(test => {
      if (test.damperId) {
        damperIdMapping.set(test.damperId, newDamper.id);
      }
    });
  });
  
  // Update all test damperId references
  const updatedTests: Record<string, Test> = {};
  Object.values(data.tests).forEach(test => {
    const newDamperId = test.damperId 
      ? damperIdMapping.get(test.damperId) 
      : undefined;
    
    updatedTests[test.id] = {
      ...test,
      damperId: newDamperId,
    };
  });
  
  return {
    ...data,
    version: 3,
    dampers: newDampers,
    tests: updatedTests,
  };
}

/**
 * Migrate from version 3 to version 4
 * Adds stairwellTests collection for differential pressure testing
 */
function migrateV3ToV4(data: StorageData): StorageData {
  console.log('Adding stairwellTests collection for differential pressure testing');
  
  return {
    ...data,
    version: 4,
    stairwellTests: data.stairwellTests || {},
  };
}

/**
 * Migrate from version 4 to version 5
 * Adds projects and damperTemplates collections
 */
function migrateV4ToV5(data: StorageData): StorageData {
  console.log('Adding projects and damperTemplates collections');
  
  return {
    ...data,
    version: 5,
    projects: data.projects || {},
    damperTemplates: data.damperTemplates || {},
  };
}

/**
 * Load data from LocalStorage with automatic migration
 */
export function loadStorageData(): StorageData {
  try {
    // Try to load new format
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      let data = JSON.parse(rawData) as StorageData;
      
      // Check if migration is needed
      if (data.version < STORAGE_VERSION) {
        console.log(`Migrating storage from version ${data.version} to ${STORAGE_VERSION}`);
        
        // Apply migrations sequentially
        if (data.version === 2) {
          data = migrateV2ToV3(data);
        }
        if (data.version === 3) {
          data = migrateV3ToV4(data);
        }
        if (data.version === 4) {
          data = migrateV4ToV5(data);
        }
        
        // Save migrated data
        saveStorageData(data);
      }
      
      // Ensure all collections exist (defensive)
      if (!data.stairwellTests) {
        data.stairwellTests = {};
      }
      if (!data.projects) {
        data.projects = {};
      }
      if (!data.damperTemplates) {
        data.damperTemplates = {};
      }
      
      return data;
    }
    
    // Try to load legacy format
    const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyData) {
      console.log('Migrating from legacy storage format');
      const legacyTests = JSON.parse(legacyData) as Test[];
      const migratedData = migrateLegacyData(legacyTests);
      
      // Save migrated data
      saveStorageData(migratedData);
      
      // Keep legacy data as backup
      localStorage.setItem(`${LEGACY_STORAGE_KEY}_backup`, legacyData);
      
      return migratedData;
    }
    
    // No existing data, return empty structure
    return initializeStorage();
  } catch (error) {
    console.error('Error loading storage data:', error);
    return initializeStorage();
  }
}

/**
 * Save data to LocalStorage
 */
export function saveStorageData(data: StorageData): void {
  try {
    data.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving storage data:', error);
    throw new Error('Failed to save data. Storage may be full.');
  }
}

/**
 * Export all data as JSON file
 */
export function exportData(): string {
  const data = loadStorageData();
  return JSON.stringify(data, null, 2);
}

/**
 * Import data from JSON string
 */
export function importData(jsonString: string): StorageData {
  try {
    const imported = JSON.parse(jsonString) as StorageData;
    
    // Validate basic structure
    if (!imported.tests || !imported.dampers || !imported.reports) {
      throw new Error('Invalid data structure');
    }
    
    // Ensure all collections exist
    if (!imported.stairwellTests) {
      imported.stairwellTests = {};
    }
    if (!imported.projects) {
      imported.projects = {};
    }
    if (!imported.damperTemplates) {
      imported.damperTemplates = {};
    }
    
    // Validate schemas
    Object.values(imported.tests).forEach(test => {
      testSchema.parse(test);
    });
    Object.values(imported.dampers).forEach(damper => {
      damperSchema.parse(damper);
    });
    Object.values(imported.reports).forEach(report => {
      reportSchema.parse(report);
    });
    Object.values(imported.stairwellTests).forEach(stairwellTest => {
      stairwellPressureTestSchema.parse(stairwellTest);
    });
    Object.values(imported.projects).forEach(project => {
      projectSchema.parse(project);
    });
    Object.values(imported.damperTemplates).forEach(template => {
      damperTemplateSchema.parse(template);
    });
    
    // Save imported data
    saveStorageData(imported);
    
    return imported;
  } catch (error) {
    console.error('Error importing data:', error);
    throw new Error('Failed to import data. File may be corrupted or invalid.');
  }
}

/**
 * Get storage size estimate in bytes
 */
export function getStorageSize(): number {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? new Blob([data]).size : 0;
}

/**
 * Check if storage is approaching limit (warning at 4MB, limit ~5MB)
 */
export function isStorageNearLimit(): boolean {
  const size = getStorageSize();
  return size > 4 * 1024 * 1024; // 4MB
}
