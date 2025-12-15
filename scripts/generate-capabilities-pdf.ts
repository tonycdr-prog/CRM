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

function addPage() {
  doc.addPage();
  y = margin;
}

function checkPageBreak(height: number) {
  if (y + height > pageHeight - margin) {
    addPage();
  }
}

function addText(text: string, fontSize: number, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', isBold ? 'bold' : 'normal');
  doc.setTextColor(color[0], color[1], color[2]);
  
  const lines = doc.splitTextToSize(text, contentWidth);
  const lineHeight = fontSize * 0.5;
  
  for (const line of lines) {
    checkPageBreak(lineHeight);
    doc.text(line, margin, y);
    y += lineHeight;
  }
}

function processMarkdown(content: string) {
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines but add small spacing
    if (line.trim() === '') {
      y += 2;
      continue;
    }
    
    // Horizontal rule
    if (line.trim() === '---') {
      checkPageBreak(5);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
      continue;
    }
    
    // Headers
    if (line.startsWith('# ')) {
      y += 5;
      addText(line.substring(2), 24, true, [0, 51, 102]);
      y += 5;
      continue;
    }
    
    if (line.startsWith('## ')) {
      y += 4;
      addText(line.substring(3), 18, true, [0, 76, 153]);
      y += 3;
      continue;
    }
    
    if (line.startsWith('### ')) {
      y += 3;
      addText(line.substring(4), 14, true, [51, 51, 51]);
      y += 2;
      continue;
    }
    
    // Bold text (simplified - just remove ** markers)
    let processedLine = line.replace(/\*\*(.*?)\*\*/g, '$1');
    processedLine = processedLine.replace(/\*(.*?)\*/g, '$1');
    
    // Bullet points
    if (processedLine.startsWith('- ')) {
      const bulletText = '• ' + processedLine.substring(2);
      addText(bulletText, 10, false);
      y += 1;
      continue;
    }
    
    // Numbered lists
    const numberedMatch = processedLine.match(/^(\d+)\.\s+/);
    if (numberedMatch) {
      addText(processedLine, 10, false);
      y += 1;
      continue;
    }
    
    // Checkboxes
    if (processedLine.startsWith('- [ ]')) {
      const checkText = '☐ ' + processedLine.substring(6);
      addText(checkText, 10, false);
      y += 1;
      continue;
    }
    
    // Tables (simplified - just show as text)
    if (processedLine.startsWith('|')) {
      const cells = processedLine.split('|').filter(c => c.trim()).map(c => c.trim());
      if (!cells.every(c => c.match(/^[-:]+$/))) {
        addText(cells.join('  |  '), 9, false);
      }
      y += 1;
      continue;
    }
    
    // Code blocks
    if (processedLine.startsWith('```')) {
      continue;
    }
    
    // Regular paragraph
    if (processedLine.trim()) {
      addText(processedLine, 10, false);
    }
  }
}

// Title page
doc.setFillColor(0, 51, 102);
doc.rect(0, 0, pageWidth, 80, 'F');

doc.setTextColor(255, 255, 255);
doc.setFontSize(32);
doc.setFont('helvetica', 'bold');
doc.text('Airflow Velocity Testing', pageWidth / 2, 35, { align: 'center' });
doc.setFontSize(18);
doc.text('Complete App Capabilities', pageWidth / 2, 50, { align: 'center' });
doc.setFontSize(12);
doc.setFont('helvetica', 'normal');
doc.text('A Demonstration Guide', pageWidth / 2, 65, { align: 'center' });

y = 100;
doc.setTextColor(100, 100, 100);
doc.setFontSize(10);
doc.text('Professional UK-Compliant Smoke Control Testing', pageWidth / 2, y, { align: 'center' });
y += 8;
doc.text('Web & Mobile Application (iOS/Android)', pageWidth / 2, y, { align: 'center' });
y += 20;

doc.setTextColor(0, 0, 0);
doc.setFontSize(11);
const features = [
  'Smoke Control Damper Velocity Testing',
  'Stairwell Differential Pressure Testing',
  'Professional PDF Report Generation',
  'UK Building Standards Compliance',
  'Business Management CRM',
  'Offline-First Mobile App',
  'Trend Analysis & Anomaly Detection'
];

for (const feature of features) {
  doc.text('• ' + feature, margin + 20, y);
  y += 7;
}

y += 20;
doc.setFontSize(9);
doc.setTextColor(100, 100, 100);
doc.text('Generated: ' + new Date().toLocaleDateString('en-GB'), pageWidth / 2, y, { align: 'center' });

// Start content on new page
addPage();

// Process the markdown content (skip the first title since we have a cover page)
const contentWithoutTitle = markdown.replace(/^# Airflow Velocity Testing - Complete App Capabilities\n*/, '');
processMarkdown(contentWithoutTitle);

// Add page numbers
const totalPages = doc.getNumberOfPages();
for (let i = 2; i <= totalPages; i++) {
  doc.setPage(i);
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(`Page ${i - 1} of ${totalPages - 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
}

// Save
const pdfBuffer = doc.output('arraybuffer');
fs.writeFileSync('APP_CAPABILITIES.pdf', Buffer.from(pdfBuffer));
console.log('PDF generated: APP_CAPABILITIES.pdf');
console.log('Total pages:', totalPages);
