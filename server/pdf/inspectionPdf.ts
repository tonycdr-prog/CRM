import PDFDocument from "pdfkit";
import fs from "fs";

export type PdfAttachment = {
  originalName: string;
  mimeType?: string | null;
  localPath?: string | null;
  downloadUrl?: string | null;
};

export type PdfRow = {
  component: string;
  activity: string;
  reference?: string | null;
  fieldType: string;
  units?: string | null;
  evidenceRequired: boolean;
  value: string;
  comment?: string | null;
  attachments: PdfAttachment[];
};

export type PdfEntity = {
  title: string;
  description?: string | null;
  rows: PdfRow[];
};

export type PdfPayload = {
  inspectionId: string;
  templateName: string;
  systemTypeName: string;
  jobId: string;
  completedAt: string;
  entities: PdfEntity[];
};

function drawKeyValue(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc.font("Helvetica-Bold").text(label, { continued: true });
  doc.font("Helvetica").text(` ${value}`);
}

function isImageMime(m?: string | null) {
  return !!m && (m.startsWith("image/jpeg") || m.startsWith("image/png") || m.startsWith("image/webp"));
}

function safeExists(p?: string | null) {
  try {
    return !!p && fs.existsSync(p);
  } catch {
    return false;
  }
}

function ensureSpace(doc: PDFKit.PDFDocument, neededHeight: number) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + neededHeight > bottom) doc.addPage();
}

export function buildInspectionPdf(payload: PdfPayload) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 60, left: 50, right: 50, bottom: 60 },
    info: {
      Title: `Inspection ${payload.inspectionId}`,
      Author: "Life Safety OPS",
    },
  });

  let pageNum = 0;

  function addHeaderFooter() {
    pageNum++;
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;

    doc.font("Helvetica-Bold").fontSize(9).fillColor("gray");
    doc.text("Inspection Report", left, 20, { width: right - left, align: "left" });
    doc.font("Helvetica").text(
      `Job ${payload.jobId} \u2022 ${payload.templateName}`,
      left,
      20,
      { width: right - left, align: "right" }
    );

    doc.font("Helvetica").fontSize(9).fillColor("gray");
    doc.text(`Page ${pageNum}`, left, doc.page.height - 35, { width: right - left, align: "center" });
    doc.fillColor("black");
  }

  doc.on("pageAdded", addHeaderFooter);
  addHeaderFooter();

  doc.fontSize(20).font("Helvetica-Bold").text("Inspection Report");
  doc.moveDown(0.3);
  doc.fontSize(12).font("Helvetica").fillColor("gray").text(payload.systemTypeName);
  doc.fillColor("black");
  doc.moveDown(0.8);

  const boxX = doc.page.margins.left;
  const boxY = doc.y;
  const boxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc.fontSize(11).font("Helvetica");
  drawKeyValue(doc, "Job ID:", payload.jobId);
  drawKeyValue(doc, "System:", payload.systemTypeName);
  drawKeyValue(doc, "Template:", payload.templateName);
  drawKeyValue(doc, "Completed:", new Date(payload.completedAt).toLocaleDateString("en-GB"));
  drawKeyValue(doc, "Inspection ID:", payload.inspectionId);

  const boxHeight = doc.y - boxY + 8;
  doc.rect(boxX - 6, boxY - 6, boxWidth + 12, boxHeight).strokeColor("#e0e0e0").stroke();
  doc.strokeColor("black");

  doc.moveDown(1.0);
  doc.moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor("#cccccc")
    .stroke();
  doc.strokeColor("black");
  doc.moveDown(0.8);

  const maxThumbsPerRow = 2;
  const thumbMaxWidth = 220;
  const thumbMaxHeight = 140;

  for (const entity of payload.entities) {
    ensureSpace(doc, 80);
    doc.fontSize(14).font("Helvetica-Bold").text(entity.title);
    if (entity.description) {
      doc.fontSize(10).font("Helvetica").fillColor("gray").text(entity.description);
      doc.fillColor("black");
    }
    doc.moveDown(0.4);

    for (const row of entity.rows) {
      ensureSpace(doc, 140);

      doc.fontSize(11).font("Helvetica-Bold").text(`${row.component} \u2014 ${row.activity}`);
      doc.fontSize(10).font("Helvetica").fillColor("gray");
      const metaParts: string[] = [];
      if (row.reference) metaParts.push(`Ref: ${row.reference}`);
      metaParts.push(`Type: ${row.fieldType}`);
      if (row.units) metaParts.push(`Units: ${row.units}`);
      if (row.evidenceRequired) metaParts.push(`Evidence required`);
      doc.text(metaParts.join(" \u2022 "));
      doc.fillColor("black");

      doc.fontSize(11).font("Helvetica").text(`Result: ${row.value || "\u2014"}`);

      if (row.comment) {
        doc.fontSize(10).fillColor("gray").text(`Comment: ${row.comment}`);
        doc.fillColor("black");
      }

      const images = row.attachments.filter((a) => isImageMime(a.mimeType) && safeExists(a.localPath));
      const nonImages = row.attachments.filter((a) => !isImageMime(a.mimeType));

      if (nonImages.length) {
        doc.fontSize(10).fillColor("gray").text(
          `Attachments: ${nonImages.map((a) => a.originalName).join(", ")}`
        );
        doc.fillColor("black");
      }

      const imgsToRender = images.slice(0, maxThumbsPerRow);
      if (imgsToRender.length) {
        doc.moveDown(0.2);
        doc.fontSize(10).fillColor("gray").text("Evidence thumbnails:");
        doc.fillColor("black");

        for (const img of imgsToRender) {
          ensureSpace(doc, thumbMaxHeight + 50);

          doc.fontSize(9).fillColor("gray").text(img.originalName);
          doc.fillColor("black");

          const x = doc.page.margins.left;
          const y = doc.y + 4;

          try {
            doc.image(img.localPath as string, x, y, {
              fit: [thumbMaxWidth, thumbMaxHeight],
            });
            doc.y = y + thumbMaxHeight + 6;
          } catch {
            doc.fontSize(10).fillColor("gray").text("(Unable to render image)");
            doc.fillColor("black");
            doc.moveDown(0.5);
          }
        }

        if (images.length > maxThumbsPerRow) {
          doc.fontSize(9).fillColor("gray").text(`(+${images.length - maxThumbsPerRow} more image(s) not shown)`);
          doc.fillColor("black");
        }
      }

      const withLinks = row.attachments.filter((a) => a.downloadUrl);
      if (withLinks.length) {
        doc.moveDown(0.2);
        doc.fontSize(10).fillColor("gray").text("Download links:");
        doc.fillColor("blue");

        for (const a of withLinks) {
          ensureSpace(doc, 18);
          doc.text(a.originalName, {
            link: a.downloadUrl as string,
            underline: true,
          });
        }

        doc.fillColor("black");
      }

      doc.moveDown(0.6);
      ensureSpace(doc, 20);
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor("#eeeeee")
        .stroke()
        .strokeColor("black");
      doc.moveDown(0.6);
    }

    doc.moveDown(0.8);
  }

  return doc;
}
