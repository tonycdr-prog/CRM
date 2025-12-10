import { Test, StairwellPressureTest, LevelMeasurement } from "@shared/schema";

function escapeCSV(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportDamperTestsToCSV(tests: Test[]): string {
  const headers = [
    "Test ID",
    "Test Date",
    "Building",
    "Location",
    "Floor",
    "Shaft ID",
    "System Type",
    "Tester Name",
    "Damper Width (mm)",
    "Damper Height (mm)",
    "Free Area (m²)",
    "Grid Size",
    "Average Velocity (m/s)",
    "Pass/Fail",
    "Notes",
    "Individual Readings (m/s)",
  ];

  const rows = tests.map((test) => {
    const passThreshold = 2.5;
    const passFail = test.average >= passThreshold ? "PASS" : "FAIL";
    const readingsStr = test.readings
      .filter((r): r is number => typeof r === "number")
      .join("; ");

    return [
      escapeCSV(test.id),
      escapeCSV(test.testDate),
      escapeCSV(test.building),
      escapeCSV(test.location),
      escapeCSV(test.floorNumber),
      escapeCSV(test.shaftId),
      escapeCSV(test.systemType),
      escapeCSV(test.testerName),
      escapeCSV(test.damperWidth),
      escapeCSV(test.damperHeight),
      escapeCSV(test.freeArea?.toFixed(4)),
      escapeCSV(test.gridSize || 5),
      escapeCSV(test.average.toFixed(2)),
      escapeCSV(passFail),
      escapeCSV(test.notes),
      escapeCSV(readingsStr),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function exportStairwellTestsToCSV(tests: StairwellPressureTest[]): string {
  const headers = [
    "Test ID",
    "Test Date",
    "Building",
    "Stairwell ID",
    "Stairwell Location",
    "System Type",
    "Standard Version",
    "Scenario",
    "Tester Name",
    "Fan Running",
    "Fan Speed",
    "Average Differential (Pa)",
    "Min Differential (Pa)",
    "Max Differential (Pa)",
    "Average Door Force (N)",
    "Max Door Force (N)",
    "Pressure Compliant",
    "Force Compliant",
    "Overall Compliant",
    "Notes",
    "Recommendations",
    "Floor Measurements",
  ];

  const rows = tests.map((test) => {
    const floorMeasurements = test.levelMeasurements
      .map((m) => `${m.floorNumber}: ${m.differentialPressure ?? "N/A"}Pa`)
      .join("; ");

    return [
      escapeCSV(test.id),
      escapeCSV(test.testDate),
      escapeCSV(test.building),
      escapeCSV(test.stairwellId),
      escapeCSV(test.stairwellLocation),
      escapeCSV(test.systemType),
      escapeCSV(test.standardVersion),
      escapeCSV(test.scenario),
      escapeCSV(test.testerName),
      escapeCSV(test.fanRunning ? "Yes" : "No"),
      escapeCSV(test.fanSpeed ? `${test.fanSpeed}${test.fanSpeedUnit === "percent" ? "%" : test.fanSpeedUnit}` : ""),
      escapeCSV(test.averageDifferential?.toFixed(2)),
      escapeCSV(test.minDifferential?.toFixed(2)),
      escapeCSV(test.maxDifferential?.toFixed(2)),
      escapeCSV(test.averageDoorForce?.toFixed(2)),
      escapeCSV(test.maxDoorForce?.toFixed(2)),
      escapeCSV(test.overallPressureCompliant ? "Yes" : "No"),
      escapeCSV(test.overallForceCompliant ? "Yes" : "No"),
      escapeCSV(test.overallCompliant ? "Yes" : "No"),
      escapeCSV(test.notes),
      escapeCSV(test.recommendations),
      escapeCSV(floorMeasurements),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
