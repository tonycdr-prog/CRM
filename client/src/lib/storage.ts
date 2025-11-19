import { Test, Damper, Report, damperSchema, reportSchema, testSchema } from "@shared/schema";
import { nanoid } from "nanoid";

const STORAGE_VERSION = 2;
const STORAGE_KEY = "airflow-data";
const LEGACY_STORAGE_KEY = "airflow-tests";

export interface StorageData {
  version: number;
  tests: Record<string, Test>;
  dampers: Record<string, Damper>;
  reports: Record<string, Report>;
  lastUpdated: number;
}

/**
 * Generate a unique damper key from building, location, and shaftId
 */
export function generateDamperKey(building: string, location: string, shaftId: string): string {
  return `${building.trim().toLowerCase()}_${location.trim().toLowerCase()}_${shaftId.trim().toLowerCase()}`;
}

/**
 * Get or create a damper entity for a test
 */
export function getOrCreateDamper(
  test: Test,
  dampers: Record<string, Damper>
): Damper {
  const damperKey = generateDamperKey(test.building, test.location, test.shaftId);
  
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
    shaftId: test.shaftId,
    systemType: test.systemType,
    description: `Damper at ${test.location}, Floor ${test.floorNumber}`,
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
  
  return data;
}

/**
 * Load data from LocalStorage with automatic migration
 */
export function loadStorageData(): StorageData {
  try {
    // Try to load new format
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      const data = JSON.parse(rawData) as StorageData;
      
      // Check if migration is needed
      if (data.version < STORAGE_VERSION) {
        console.log(`Migrating storage from version ${data.version} to ${STORAGE_VERSION}`);
        // Future migrations would go here
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
