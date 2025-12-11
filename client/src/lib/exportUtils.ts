export function exportToCSV<T>(
  data: T[],
  filename: string,
  columns: { key: keyof T; header: string }[]
): void {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = columns.map(c => c.header).join(",");
  const rows = data.map(item => 
    columns.map(c => {
      const value = (item as Record<string, unknown>)[c.key as string];
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(",")
  );

  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function filterByDateRange<T extends { [key: string]: unknown }>(
  data: T[],
  dateField: keyof T,
  startDate: Date | null,
  endDate: Date | null
): T[] {
  return data.filter(item => {
    const itemDate = item[dateField];
    if (!itemDate || typeof itemDate !== "string") return true;
    const date = new Date(itemDate);
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  });
}
