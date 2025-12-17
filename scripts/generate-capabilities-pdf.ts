import fs from 'fs';
import { jsPDF } from 'jspdf';

const markdown = fs.readFileSync('APP_CAPABILITIES.md', 'utf-8');

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

const pageWidth = 210;
const pageHeight = 297;
const margin = 20;
const contentWidth = pageWidth - (margin * 2);
let y = margin;

// Colours for consistent theming
const primaryColor: [number, number, number] = [0, 51, 102];
const secondaryColor: [number, number, number] = [0, 102, 153];
const accentColor: [number, number, number] = [51, 153, 102];
const textColor: [number, number, number] = [33, 33, 33];
const mutedColor: [number, number, number] = [100, 100, 100];

// Track TOC entries dynamically
interface TocEntry {
  title: string;
  page: number;
  level: number;
}
const tocEntries: TocEntry[] = [];

function addPage() {
  doc.addPage();
  y = margin;
}

function checkPageBreak(height: number) {
  if (y + height > pageHeight - margin - 10) {
    addPage();
  }
}

function getCurrentPage(): number {
  return doc.getNumberOfPages();
}

function addText(text: string, fontSize: number, isBold: boolean = false, color: [number, number, number] = textColor, indent: number = 0) {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', isBold ? 'bold' : 'normal');
  doc.setTextColor(color[0], color[1], color[2]);
  
  const effectiveWidth = contentWidth - indent;
  const lines = doc.splitTextToSize(text, effectiveWidth);
  const lineHeight = fontSize * 0.75;
  
  for (const line of lines) {
    checkPageBreak(lineHeight);
    doc.text(line, margin + indent, y);
    y += lineHeight;
  }
}

function addParagraphSpacing(size: number = 4) {
  y += size;
}

function addPlaceholderImage(title: string, description: string) {
  const boxHeight = 40;
  checkPageBreak(boxHeight + 8);
  
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(200, 210, 220);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, 'FD');
  
  const iconX = margin + contentWidth / 2;
  const iconY = y + 12;
  doc.setFillColor(180, 190, 200);
  doc.circle(iconX, iconY, 6, 'F');
  doc.setFillColor(245, 247, 250);
  doc.circle(iconX, iconY, 4, 'F');
  doc.setFillColor(180, 190, 200);
  doc.circle(iconX, iconY, 2, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 110, 120);
  doc.text(title, pageWidth / 2, y + 26, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(140, 150, 160);
  doc.text(description, pageWidth / 2, y + 33, { align: 'center' });
  
  y += boxHeight + 6;
}

function addTable(rows: string[][]) {
  if (rows.length === 0) return;
  
  const colCount = rows[0].length;
  const colWidth = contentWidth / colCount;
  const cellPadding = 2;
  
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const isHeader = rowIndex === 0;
    
    let maxLines = 1;
    const cellLines: string[][] = [];
    
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cellText = row[colIndex].trim();
      const lines = doc.splitTextToSize(cellText, colWidth - (cellPadding * 2));
      cellLines.push(lines);
      maxLines = Math.max(maxLines, lines.length);
    }
    
    const lineHeight = 4.5;
    const rowHeight = Math.max(8, (maxLines * lineHeight) + 4);
    
    checkPageBreak(rowHeight + 2);
    
    if (isHeader) {
      doc.setFillColor(240, 245, 250);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    } else if (rowIndex % 2 === 0) {
      doc.setFillColor(250, 250, 252);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }
    
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.2);
    for (let colIndex = 0; colIndex <= colCount; colIndex++) {
      const x = margin + (colIndex * colWidth);
      doc.line(x, y, x, y + rowHeight);
    }
    
    doc.line(margin, y, margin + contentWidth, y);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
    doc.setTextColor(isHeader ? 51 : 66, isHeader ? 51 : 66, isHeader ? 51 : 66);
    
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cellX = margin + (colIndex * colWidth) + cellPadding;
      const lines = cellLines[colIndex];
      
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        doc.text(lines[lineIndex], cellX, y + 5 + (lineIndex * lineHeight));
      }
    }
    
    y += rowHeight;
  }
  
  y += 5;
}

function processMarkdown(content: string) {
  const lines = content.split('\n');
  let inTable = false;
  let tableRows: string[][] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim().startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      if (!cells.every(c => c.match(/^[-:]+$/))) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      addTable(tableRows);
      inTable = false;
      tableRows = [];
    }
    
    if (line.trim() === '') {
      addParagraphSpacing(3);
      continue;
    }
    
    if (line.trim() === '---') {
      checkPageBreak(8);
      y += 3;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
      continue;
    }
    
    if (line.startsWith('# ')) {
      addParagraphSpacing(10);
      const title = line.substring(2);
      tocEntries.push({ title, page: getCurrentPage(), level: 1 });
      addText(title, 20, true, primaryColor);
      addParagraphSpacing(6);
      continue;
    }
    
    if (line.startsWith('## ')) {
      addParagraphSpacing(10);
      const title = line.substring(3);
      tocEntries.push({ title, page: getCurrentPage(), level: 2 });
      addText(title, 16, true, secondaryColor);
      addParagraphSpacing(5);
      continue;
    }
    
    if (line.startsWith('### ')) {
      addParagraphSpacing(8);
      const title = line.substring(4);
      tocEntries.push({ title, page: getCurrentPage(), level: 3 });
      addText(title, 13, true, [51, 51, 51]);
      addParagraphSpacing(4);
      continue;
    }
    
    if (line.startsWith('#### ')) {
      addParagraphSpacing(6);
      addText(line.substring(5), 11, true, [66, 66, 66]);
      addParagraphSpacing(3);
      continue;
    }
    
    if (line.includes('Screenshot:') || line.includes('**Screenshot:')) {
      const screenshotMatch = line.match(/\*?\*?Screenshot:\s*(.+?)\*?\*?$/);
      if (screenshotMatch) {
        addParagraphSpacing(3);
        addPlaceholderImage(screenshotMatch[1].replace(/\*+/g, ''), 'Visual reference for this feature');
        continue;
      }
    }
    
    let processedLine = line;
    processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '$1');
    processedLine = processedLine.replace(/\*(.*?)\*/g, '$1');
    processedLine = processedLine.replace(/`(.*?)`/g, '$1');
    
    if (processedLine.match(/^\s{4,}-\s/)) {
      const bulletText = '    ○ ' + processedLine.trim().substring(2);
      addText(bulletText, 10, false, textColor, 8);
      addParagraphSpacing(2);
      continue;
    }
    
    if (processedLine.match(/^\s{2}-\s/)) {
      const bulletText = '  ○ ' + processedLine.trim().substring(2);
      addText(bulletText, 10, false, textColor, 4);
      addParagraphSpacing(2);
      continue;
    }
    
    if (processedLine.startsWith('- ')) {
      const bulletText = '• ' + processedLine.substring(2);
      addText(bulletText, 10, false, textColor, 0);
      addParagraphSpacing(2);
      continue;
    }
    
    const numberedMatch = processedLine.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      const numText = numberedMatch[1] + '. ' + numberedMatch[2];
      addText(numText, 10, false, textColor, 0);
      addParagraphSpacing(2);
      continue;
    }
    
    if (processedLine.startsWith('- [ ]')) {
      const checkText = '☐ ' + processedLine.substring(6);
      addText(checkText, 10, false, textColor, 0);
      addParagraphSpacing(2);
      continue;
    }
    
    if (processedLine.startsWith('- [x]')) {
      const checkText = '☑ ' + processedLine.substring(6);
      addText(checkText, 10, false, accentColor, 0);
      addParagraphSpacing(2);
      continue;
    }
    
    if (processedLine.startsWith('```')) {
      continue;
    }
    
    if (processedLine.startsWith('>')) {
      doc.setFillColor(245, 248, 250);
      checkPageBreak(10);
      doc.rect(margin, y - 1, contentWidth, 8, 'F');
      doc.setDrawColor(0, 102, 153);
      doc.setLineWidth(0.5);
      doc.line(margin, y - 1, margin, y + 7);
      addText(processedLine.substring(1).trim(), 10, false, mutedColor, 4);
      addParagraphSpacing(3);
      continue;
    }
    
    if (processedLine.trim()) {
      addText(processedLine, 10, false, textColor);
      addParagraphSpacing(3);
    }
  }
  
  if (inTable && tableRows.length > 0) {
    addTable(tableRows);
  }
}

// ============ TITLE PAGE ============
doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
doc.rect(0, 0, pageWidth, 85, 'F');

doc.setFillColor(0, 61, 112);
doc.rect(0, 70, pageWidth, 15, 'F');

doc.setTextColor(255, 255, 255);
doc.setFontSize(32);
doc.setFont('helvetica', 'bold');
doc.text('Life Safety Ops', pageWidth / 2, 35, { align: 'center' });

doc.setFontSize(13);
doc.setFont('helvetica', 'normal');
doc.text('Life Safety Operations & Compliance Management Platform', pageWidth / 2, 50, { align: 'center' });

doc.setFontSize(16);
doc.setFont('helvetica', 'bold');
doc.text('Complete Operations Guide', pageWidth / 2, 68, { align: 'center' });

y = 105;
doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
doc.setFontSize(11);
doc.setFont('helvetica', 'normal');
doc.text('Professional UK-Compliant Life Safety Testing & Business Management', pageWidth / 2, y, { align: 'center' });
y += 7;
doc.text('Web & Mobile Application (iOS/Android) with Offline Support', pageWidth / 2, y, { align: 'center' });
y += 20;

doc.setTextColor(textColor[0], textColor[1], textColor[2]);
doc.setFontSize(11);
const features = [
  'Smoke Control Damper Velocity Testing',
  'Stairwell Differential Pressure Testing',
  'Building Safety Act Compliance & Golden Thread',
  'Professional PDF Report Generation with QR Verification',
  'Full CRM: Clients, Contracts, Jobs, Invoicing',
  'Asset & Equipment Management with Calibration Tracking',
  'Field Companion Mobile App with Offline Sync',
  'Multi-Tenant Organisation & Team Management',
  'Trend Analysis & Predictive Maintenance'
];

for (const feature of features) {
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.circle(margin + 15, y - 1.5, 1.5, 'F');
  doc.text(feature, margin + 22, y);
  y += 8;
}

y += 20;
doc.setFontSize(9);
doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
doc.text('Version 1.0  |  December 2024', pageWidth / 2, y, { align: 'center' });
y += 5;
doc.text('Generated: ' + new Date().toLocaleDateString('en-GB'), pageWidth / 2, y, { align: 'center' });

y = pageHeight - 25;
doc.setFontSize(8);
doc.setTextColor(150, 150, 150);
doc.text('Compliant with BS EN 12101, BS ISO 21927-9, BS 7346-8, BS 9999, BS 9991,', pageWidth / 2, y, { align: 'center' });
y += 4;
doc.text('RRFSO 2005, Building Safety Act 2022, and BSRIA BG 49/2024', pageWidth / 2, y, { align: 'center' });

// ============ MAIN CONTENT ============
addPage();

const contentWithoutTitle = markdown
  .replace(/^# Life Safety Ops\n*/, '')
  .replace(/## Life Safety Operations & Compliance Management Platform\n*/, '')
  .replace(/### Complete Operations Guide & How-To Manual\n*/, '');

processMarkdown(contentWithoutTitle);

// ============ INSERT TABLE OF CONTENTS ============
// Insert TOC pages after title page (page 1)
// We need to calculate how many pages the TOC will need
const tocItemsPerPage = 35;
const tocPagesNeeded = Math.ceil(tocEntries.length / tocItemsPerPage);

// Insert the TOC pages after page 1
for (let tocPageNum = 0; tocPageNum < tocPagesNeeded; tocPageNum++) {
  doc.insertPage(2 + tocPageNum);
}

// Adjust all TOC entries page numbers to account for inserted TOC pages
for (const entry of tocEntries) {
  entry.page += tocPagesNeeded;
}

// Now render the TOC on the inserted pages
for (let tocPageNum = 0; tocPageNum < tocPagesNeeded; tocPageNum++) {
  doc.setPage(2 + tocPageNum);
  y = margin;
  
  if (tocPageNum === 0) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Table of Contents', margin, y);
    y += 15;
  }
  
  const startIdx = tocPageNum * tocItemsPerPage;
  const endIdx = Math.min(startIdx + tocItemsPerPage, tocEntries.length);
  
  for (let i = startIdx; i < endIdx; i++) {
    const entry = tocEntries[i];
    const indent = (entry.level - 1) * 6;
    const fontSize = entry.level === 1 ? 11 : entry.level === 2 ? 10 : 9;
    const isBold = entry.level <= 2;
    const textColorVal = entry.level === 1 ? [33, 33, 33] : [80, 80, 80];
    
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(textColorVal[0], textColorVal[1], textColorVal[2]);
    
    // Truncate long titles
    const maxTitleWidth = contentWidth - 25 - indent;
    let displayTitle = entry.title;
    while (doc.getTextWidth(displayTitle) > maxTitleWidth && displayTitle.length > 10) {
      displayTitle = displayTitle.substring(0, displayTitle.length - 4) + '...';
    }
    
    doc.text(displayTitle, margin + indent, y);
    
    // Page number aligned right
    doc.text(entry.page.toString(), pageWidth - margin, y, { align: 'right' });
    
    // Dotted line
    const textWidth = doc.getTextWidth(displayTitle);
    const dotsStart = margin + indent + textWidth + 3;
    const dotsEnd = pageWidth - margin - 10;
    if (dotsEnd > dotsStart + 5) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineDashPattern([0.5, 1.5], 0);
      doc.line(dotsStart, y + 1, dotsEnd, y + 1);
      doc.setLineDashPattern([], 0);
    }
    
    y += entry.level === 1 ? 7 : 6;
  }
}

// ============ PAGE NUMBERS ============
const totalPages = doc.getNumberOfPages();
for (let i = 2; i <= totalPages; i++) {
  doc.setPage(i);
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(`Page ${i - 1} of ${totalPages - 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
  
  doc.setFontSize(8);
  doc.text('Life Safety Ops Operations Guide', margin, pageHeight - 10);
}

// Save
const pdfBuffer = doc.output('arraybuffer');
fs.writeFileSync('APP_CAPABILITIES.pdf', Buffer.from(pdfBuffer));
console.log('PDF generated: APP_CAPABILITIES.pdf');
console.log('Total pages:', totalPages);
console.log('TOC entries:', tocEntries.length);
console.log('TOC pages:', tocPagesNeeded);
