import { Test, Damper } from "@shared/schema";

export interface DamperYearGroup {
  damperId: string;
  damper: Damper;
  year: number;
  tests: Test[];
  averageVelocity: number;
  passCount: number;
  failCount: number;
}

export interface TrendMetrics {
  averageDelta: number; // Change in average velocity
  averageDeltaPercent: number; // Percentage change
  passRateChange: number; // Change in pass rate (percentage points)
  previousAverage: number;
  currentAverage: number;
  previousPassRate: number;
  currentPassRate: number;
}

export interface DamperHistory {
  damper: Damper;
  yearlyData: DamperYearGroup[];
  hasMultipleYears: boolean;
  totalTests: number;
}

/**
 * Extract year from test date string (YYYY-MM-DD format)
 */
export function getTestYear(testDate: string): number {
  return parseInt(testDate.split('-')[0], 10);
}

/**
 * Group tests by damper and year
 */
export function groupTestsByDamperAndYear(
  tests: Test[],
  dampers: Record<string, Damper>,
  minVelocityThreshold: number = 2.5
): Map<string, Map<number, DamperYearGroup>> {
  const groups = new Map<string, Map<number, DamperYearGroup>>();
  
  tests.forEach(test => {
    // Skip tests without damper association
    if (!test.damperId || !dampers[test.damperId]) {
      return;
    }
    
    const damperId = test.damperId;
    const damper = dampers[damperId];
    const year = getTestYear(test.testDate);
    
    // Initialize damper map if needed
    if (!groups.has(damperId)) {
      groups.set(damperId, new Map());
    }
    
    const damperYears = groups.get(damperId)!;
    
    // Initialize year group if needed
    if (!damperYears.has(year)) {
      damperYears.set(year, {
        damperId,
        damper,
        year,
        tests: [],
        averageVelocity: 0,
        passCount: 0,
        failCount: 0,
      });
    }
    
    const yearGroup = damperYears.get(year)!;
    yearGroup.tests.push(test);
  });
  
  // Calculate aggregates for each year group
  groups.forEach(damperYears => {
    damperYears.forEach(yearGroup => {
      const velocities = yearGroup.tests.map(t => t.average);
      yearGroup.averageVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
      
      yearGroup.tests.forEach(test => {
        if (test.average >= minVelocityThreshold) {
          yearGroup.passCount++;
        } else {
          yearGroup.failCount++;
        }
      });
    });
  });
  
  return groups;
}

/**
 * Detect if this is a repeat visit (has previous year data)
 */
export function detectRepeatVisit(
  damperId: string,
  currentYear: number,
  tests: Test[]
): boolean {
  const damperTests = tests.filter(t => t.damperId === damperId);
  const years = new Set(damperTests.map(t => getTestYear(t.testDate)));
  
  // Check if there are any years before the current year
  const hasHistoricalData = Array.from(years).some(year => year < currentYear);
  
  return hasHistoricalData;
}

/**
 * Calculate trend metrics comparing current year to previous year
 */
export function calculateTrendMetrics(
  currentTests: Test[],
  previousTests: Test[],
  minVelocityThreshold: number = 2.5
): TrendMetrics | null {
  if (currentTests.length === 0 || previousTests.length === 0) {
    return null;
  }
  
  // Calculate current year metrics
  const currentVelocities = currentTests.map(t => t.average);
  const currentAverage = currentVelocities.reduce((sum, v) => sum + v, 0) / currentVelocities.length;
  const currentPasses = currentTests.filter(t => t.average >= minVelocityThreshold).length;
  const currentPassRate = (currentPasses / currentTests.length) * 100;
  
  // Calculate previous year metrics
  const previousVelocities = previousTests.map(t => t.average);
  const previousAverage = previousVelocities.reduce((sum, v) => sum + v, 0) / previousVelocities.length;
  const previousPasses = previousTests.filter(t => t.average >= minVelocityThreshold).length;
  const previousPassRate = (previousPasses / previousTests.length) * 100;
  
  // Calculate deltas
  const averageDelta = currentAverage - previousAverage;
  const averageDeltaPercent = previousAverage !== 0 
    ? (averageDelta / previousAverage) * 100 
    : 0;
  const passRateChange = currentPassRate - previousPassRate;
  
  return {
    averageDelta,
    averageDeltaPercent,
    passRateChange,
    previousAverage,
    currentAverage,
    previousPassRate,
    currentPassRate,
  };
}

/**
 * Get historical data for a damper, sorted by year
 */
export function getDamperHistory(
  damperId: string,
  tests: Test[],
  dampers: Record<string, Damper>,
  minVelocityThreshold: number = 2.5
): DamperHistory | null {
  const damper = dampers[damperId];
  if (!damper) {
    return null;
  }
  
  const damperTests = tests.filter(t => t.damperId === damperId);
  if (damperTests.length === 0) {
    return null;
  }
  
  // Group by year
  const yearGroups = new Map<number, Test[]>();
  damperTests.forEach(test => {
    const year = getTestYear(test.testDate);
    if (!yearGroups.has(year)) {
      yearGroups.set(year, []);
    }
    yearGroups.get(year)!.push(test);
  });
  
  // Create yearly data with aggregates
  const yearlyData: DamperYearGroup[] = Array.from(yearGroups.entries())
    .map(([year, tests]) => {
      const velocities = tests.map(t => t.average);
      const averageVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
      
      const passCount = tests.filter(t => t.average >= minVelocityThreshold).length;
      const failCount = tests.length - passCount;
      
      return {
        damperId,
        damper,
        year,
        tests,
        averageVelocity,
        passCount,
        failCount,
      };
    })
    .sort((a, b) => a.year - b.year); // Sort by year ascending
  
  return {
    damper,
    yearlyData,
    hasMultipleYears: yearlyData.length > 1,
    totalTests: damperTests.length,
  };
}

/**
 * Get all dampers with repeat visits (multiple years of data)
 */
export function getDampersWithRepeatVisits(
  tests: Test[],
  dampers: Record<string, Damper>
): Damper[] {
  const damperYears = new Map<string, Set<number>>();
  
  tests.forEach(test => {
    if (test.damperId) {
      const year = getTestYear(test.testDate);
      if (!damperYears.has(test.damperId)) {
        damperYears.set(test.damperId, new Set());
      }
      damperYears.get(test.damperId)!.add(year);
    }
  });
  
  const repeatDamperIds = Array.from(damperYears.entries())
    .filter(([_, years]) => years.size > 1)
    .map(([damperId, _]) => damperId);
  
  return repeatDamperIds
    .map(id => dampers[id])
    .filter(Boolean);
}

/**
 * Format velocity change with sign and color
 */
export function formatVelocityChange(delta: number, percent: number): {
  text: string;
  sign: "+" | "-" | "";
  isPositive: boolean;
  isNegative: boolean;
  isNeutral: boolean;
} {
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const isNeutral = delta === 0;
  
  const sign = isPositive ? "+" : isNegative ? "-" : "";
  const absValue = Math.abs(delta).toFixed(2);
  const absPercent = Math.abs(percent).toFixed(1);
  
  const text = isNeutral 
    ? "No change" 
    : `${sign}${absValue} m/s (${sign}${absPercent}%)`;
  
  return {
    text,
    sign,
    isPositive,
    isNegative,
    isNeutral,
  };
}
