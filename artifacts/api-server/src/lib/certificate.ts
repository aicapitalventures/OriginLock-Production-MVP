import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import crypto from "crypto";

export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
  const part2 = Math.floor(1000 + Math.random() * 9000);
  return `OL-${year}-${part1}-${part2}`;
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function generateCertificatePdf(params: {
  certificateId: string;
  status: string;
  displayName: string;
  creatorHandle: string;
  projectTitle: string | null | undefined;
  fileTitle: string;
  originalFilename: string;
  fileType: string;
  fileSizeBytes: bigint;
  sha256Hash: string;
  recordedAtUtc: Date;
  verificationUrl: string;
}): Promise<Buffer> {
  const {
    certificateId,
    status,
    displayName,
    creatorHandle,
    projectTitle,
    fileTitle,
    originalFilename,
    fileType,
    fileSizeBytes,
    sha256Hash,
    recordedAtUtc,
    verificationUrl,
  } = params;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { height } = page.getSize();

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  const navyR = 0.08;
  const navyG = 0.12;
  const navyB = 0.22;

  page.drawRectangle({
    x: 0,
    y: height - 80,
    width: 612,
    height: 80,
    color: rgb(navyR, navyG, navyB),
  });

  page.drawText("ORIGINLOCK", {
    x: 40,
    y: height - 40,
    size: 22,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("Proof of Creation Certificate", {
    x: 40,
    y: height - 60,
    size: 11,
    font: helvetica,
    color: rgb(0.7, 0.8, 0.95),
  });

  const statusColor =
    status === "valid"
      ? rgb(0.12, 0.55, 0.29)
      : status === "revoked"
        ? rgb(0.8, 0.1, 0.1)
        : rgb(0.6, 0.4, 0.0);

  page.drawRectangle({
    x: 460,
    y: height - 56,
    width: 112,
    height: 24,
    color: statusColor,
    borderRadius: 4,
  });

  page.drawText(status.toUpperCase(), {
    x: 477,
    y: height - 48,
    size: 10,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  let y = height - 110;
  const leftX = 40;
  const valueX = 200;
  const lineH = 22;

  function drawField(
    label: string,
    value: string,
    mono = false,
    small = false
  ) {
    page.drawText(label, {
      x: leftX,
      y,
      size: small ? 8 : 9,
      font: helveticaBold,
      color: rgb(0.4, 0.45, 0.55),
    });
    const font = mono ? courier : helvetica;
    const fontSize = small ? 8 : 10;
    const maxWidth = 350;
    if (value.length > 60) {
      const mid = Math.floor(value.length / 2);
      page.drawText(value.slice(0, mid), {
        x: valueX,
        y: y + 2,
        size: fontSize,
        font,
        color: rgb(0.1, 0.12, 0.2),
        maxWidth,
      });
      y -= lineH * 0.6;
      page.drawText(value.slice(mid), {
        x: valueX,
        y: y + 2,
        size: fontSize,
        font,
        color: rgb(0.1, 0.12, 0.2),
        maxWidth,
      });
    } else {
      page.drawText(value || "—", {
        x: valueX,
        y: y + 2,
        size: fontSize,
        font,
        color: rgb(0.1, 0.12, 0.2),
        maxWidth,
      });
    }
    y -= lineH;
  }

  page.drawText("CERTIFICATE DETAILS", {
    x: leftX,
    y,
    size: 11,
    font: helveticaBold,
    color: rgb(navyR, navyG, navyB),
  });
  y -= 6;
  page.drawLine({
    start: { x: leftX, y },
    end: { x: 572, y },
    thickness: 1,
    color: rgb(0.85, 0.87, 0.92),
  });
  y -= 18;

  drawField("Certificate ID", certificateId, true);
  drawField("Certificate Status", status.charAt(0).toUpperCase() + status.slice(1));
  drawField("Creator Name", displayName);
  drawField("Creator Handle", `@${creatorHandle}`);
  if (projectTitle) drawField("Project", projectTitle);

  y -= 8;
  page.drawText("FILE INFORMATION", {
    x: leftX,
    y,
    size: 11,
    font: helveticaBold,
    color: rgb(navyR, navyG, navyB),
  });
  y -= 6;
  page.drawLine({
    start: { x: leftX, y },
    end: { x: 572, y },
    thickness: 1,
    color: rgb(0.85, 0.87, 0.92),
  });
  y -= 18;

  drawField("File Title", fileTitle);
  drawField("Original Filename", originalFilename);
  drawField("File Type", fileType.toUpperCase());
  drawField("File Size", formatFileSize(fileSizeBytes));

  y -= 8;
  page.drawText("CRYPTOGRAPHIC PROOF", {
    x: leftX,
    y,
    size: 11,
    font: helveticaBold,
    color: rgb(navyR, navyG, navyB),
  });
  y -= 6;
  page.drawLine({
    start: { x: leftX, y },
    end: { x: 572, y },
    thickness: 1,
    color: rgb(0.85, 0.87, 0.92),
  });
  y -= 18;

  drawField("Timestamp (UTC)", recordedAtUtc.toISOString());
  drawField("SHA-256 Hash", sha256Hash, true, true);

  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 120,
    margin: 1,
  });
  const qrBase64 = qrDataUrl.replace("data:image/png;base64,", "");
  const qrBytes = Buffer.from(qrBase64, "base64");
  const qrImage = await pdfDoc.embedPng(qrBytes);

  const qrSize = 100;
  const qrX = 612 - 40 - qrSize;
  const qrY = 120;

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  page.drawText("Scan to verify", {
    x: qrX + 12,
    y: qrY - 14,
    size: 8,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.55),
  });

  y -= 8;
  page.drawText("VERIFICATION", {
    x: leftX,
    y,
    size: 11,
    font: helveticaBold,
    color: rgb(navyR, navyG, navyB),
  });
  y -= 6;
  page.drawLine({
    start: { x: leftX, y },
    end: { x: 572, y },
    thickness: 1,
    color: rgb(0.85, 0.87, 0.92),
  });
  y -= 18;

  page.drawText("Verification URL:", {
    x: leftX,
    y,
    size: 9,
    font: helveticaBold,
    color: rgb(0.4, 0.45, 0.55),
  });
  page.drawText(verificationUrl, {
    x: valueX,
    y,
    size: 9,
    font: courier,
    color: rgb(0.1, 0.3, 0.7),
    maxWidth: 300,
  });

  page.drawRectangle({
    x: 0,
    y: 0,
    width: 612,
    height: 70,
    color: rgb(0.96, 0.96, 0.98),
  });

  const disclaimer =
    "This certificate records a file fingerprint, claimant profile, and recorded timestamp for documentation and verification purposes. It is not a substitute for formal copyright registration or legal advice.";
  const disclaimerLines = wrapText(disclaimer, 72);
  let dy = 52;
  for (const line of disclaimerLines) {
    page.drawText(line, {
      x: 40,
      y: dy,
      size: 7.5,
      font: helvetica,
      color: rgb(0.45, 0.45, 0.5),
    });
    dy -= 12;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function formatFileSize(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length <= maxChars) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
