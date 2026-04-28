import { Invoice } from "../drizzle/schema";
import { getCustomerById } from "./db";
import { getProjectById } from "./db";
import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import { readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

interface InvoiceData {
  invoice: Invoice;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  projectTitle: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

/**
 * Generate a professional PDF invoice
 * Returns the PDF as a Buffer
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();

  // Company header
  page.drawText("ROOFTOP RENOVATORS", {
    x: 50,
    y: height - 50,
    size: 24,
    color: rgb(0.1, 0.3, 0.6), // Deep blue
    font: await pdfDoc.embedFont("Helvetica-Bold"),
  });

  page.drawText("Professional Roofing Services", {
    x: 50,
    y: height - 75,
    size: 10,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Invoice title and number
  page.drawText("INVOICE", {
    x: width - 150,
    y: height - 50,
    size: 18,
    color: rgb(0.1, 0.3, 0.6),
    font: await pdfDoc.embedFont("Helvetica-Bold"),
  });

  page.drawText(`Invoice #: ${data.invoice.invoiceNumber}`, {
    x: width - 150,
    y: height - 75,
    size: 10,
  });

  // Invoice details
  let yPos = height - 120;
  page.drawText(`Issue Date: ${formatDate(data.invoice.issueDate)}`, {
    x: 50,
    y: yPos,
    size: 10,
  });

  yPos -= 20;
  page.drawText(`Due Date: ${formatDate(data.invoice.dueDate)}`, {
    x: 50,
    y: yPos,
    size: 10,
  });

  // Customer information
  yPos -= 40;
  page.drawText("BILL TO:", {
    x: 50,
    y: yPos,
    size: 12,
    font: await pdfDoc.embedFont("Helvetica-Bold"),
  });

  yPos -= 20;
  page.drawText(data.customerName, {
    x: 50,
    y: yPos,
    size: 10,
  });

  yPos -= 15;
  page.drawText(`Email: ${data.customerEmail}`, {
    x: 50,
    y: yPos,
    size: 10,
  });

  yPos -= 15;
  page.drawText(`Phone: ${data.customerPhone}`, {
    x: 50,
    y: yPos,
    size: 10,
  });

  yPos -= 15;
  page.drawText(`Project: ${data.projectTitle}`, {
    x: 50,
    y: yPos,
    size: 10,
  });

  // Line items table
  yPos -= 40;
  const tableTop = yPos;
  const colWidths = [250, 80, 80, 100];
  const rowHeight = 20;

  // Table header
  page.drawText("Description", { x: 50, y: yPos, size: 10, font: await pdfDoc.embedFont("Helvetica-Bold") });
  page.drawText("Qty", { x: 50 + colWidths[0], y: yPos, size: 10, font: await pdfDoc.embedFont("Helvetica-Bold") });
  page.drawText("Unit Price", { x: 50 + colWidths[0] + colWidths[1], y: yPos, size: 10, font: await pdfDoc.embedFont("Helvetica-Bold") });
  page.drawText("Total", { x: 50 + colWidths[0] + colWidths[1] + colWidths[2], y: yPos, size: 10, font: await pdfDoc.embedFont("Helvetica-Bold") });

  // Draw line under header
  yPos -= 5;
  page.drawLine({
    start: { x: 50, y: yPos },
    end: { x: 550, y: yPos },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Line items
  yPos -= 20;
  data.lineItems.forEach((item) => {
    page.drawText(item.description.substring(0, 40), { x: 50, y: yPos, size: 9 });
    page.drawText(item.quantity.toString(), { x: 50 + colWidths[0], y: yPos, size: 9 });
    page.drawText(`$${item.unitPrice.toFixed(2)}`, { x: 50 + colWidths[0] + colWidths[1], y: yPos, size: 9 });
    page.drawText(`$${item.total.toFixed(2)}`, { x: 50 + colWidths[0] + colWidths[1] + colWidths[2], y: yPos, size: 9 });
    yPos -= rowHeight;
  });

  // Totals section
  yPos -= 10;
  page.drawLine({
    start: { x: 50, y: yPos },
    end: { x: 550, y: yPos },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  yPos -= 20;
  const subtotal = parseFloat(data.invoice.subtotal);
  const tax = parseFloat(data.invoice.tax || "0");
  const total = parseFloat(data.invoice.total);

  page.drawText("Subtotal:", { x: 350, y: yPos, size: 10, font: await pdfDoc.embedFont("Helvetica-Bold") });
  page.drawText(`$${subtotal.toFixed(2)}`, { x: 450, y: yPos, size: 10 });

  yPos -= 20;
  page.drawText("HST (13%):", { x: 350, y: yPos, size: 10, font: await pdfDoc.embedFont("Helvetica-Bold") });
  page.drawText(`$${tax.toFixed(2)}`, { x: 450, y: yPos, size: 10 });

  yPos -= 20;
  page.drawText("TOTAL:", { x: 350, y: yPos, size: 12, font: await pdfDoc.embedFont("Helvetica-Bold"), color: rgb(0.1, 0.3, 0.6) });
  page.drawText(`$${total.toFixed(2)}`, { x: 450, y: yPos, size: 12, font: await pdfDoc.embedFont("Helvetica-Bold"), color: rgb(0.1, 0.3, 0.6) });

  // Payment status
  yPos -= 40;
  const statusColor = data.invoice.status === "paid" ? rgb(0.2, 0.6, 0.2) : rgb(0.8, 0.5, 0.1);
  page.drawText(`Status: ${data.invoice.status.toUpperCase()}`, {
    x: 50,
    y: yPos,
    size: 10,
    color: statusColor,
    font: await pdfDoc.embedFont("Helvetica-Bold"),
  });

  // Notes
  if (data.invoice.notes) {
    yPos -= 30;
    page.drawText("Notes:", {
      x: 50,
      y: yPos,
      size: 10,
      font: await pdfDoc.embedFont("Helvetica-Bold"),
    });

    yPos -= 15;
    const noteLines = wrapText(data.invoice.notes, 80);
    noteLines.forEach((line) => {
      page.drawText(line, { x: 50, y: yPos, size: 9 });
      yPos -= 15;
    });
  }

  // Footer
  page.drawText("Thank you for your business!", {
    x: 50,
    y: 30,
    size: 10,
    color: rgb(0.4, 0.4, 0.4),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Save PDF to file and return the file path
 */
export async function savePDFToFile(pdfBuffer: Buffer, invoiceNumber: string): Promise<string> {
  const filename = `invoice-${invoiceNumber.replace(/\//g, "-")}.pdf`;
  const filepath = join(tmpdir(), filename);
  writeFileSync(filepath, pdfBuffer);
  return filepath;
}

/**
 * Format date for display
 */
function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Wrap text to fit within a certain character width
 */
function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  const words = text.split(" ");
  let currentLine = "";

  words.forEach((word) => {
    if ((currentLine + word).length > maxChars) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine += (currentLine ? " " : "") + word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}
