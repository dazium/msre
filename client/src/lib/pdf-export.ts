import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

export interface LineItem {
  material: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

type RawPDFInput = Record<string, unknown>;

export interface EstimatePDFData {
  estimateNumber: string;
  customerName: string;
  projectTitle: string;
  lineItems: LineItem[];
  subtotal: number;
  total: number;
  createdDate: Date;
  validUntil?: Date;
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
}

export interface InvoicePDFData {
  invoiceNumber: string;
  customerName: string;
  projectTitle: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdDate: Date;
  dueDate?: Date;
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
  paymentTerms?: string;
}

const DEFAULT_COMPANY_NAME = "MUNRO and Sons Roofing Experts";

function asRecord(value: unknown): RawPDFInput {
  return value && typeof value === "object" ? value as RawPDFInput : {};
}

function asText(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function asAmount(value: unknown, fallback = 0): number {
  const amount = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(amount) ? amount : fallback;
}

function asDate(value: unknown, fallback = new Date()): Date {
  const date = value instanceof Date ? value : new Date(String(value ?? ""));
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function optionalDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const date = asDate(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function normalizePdfLineItems(value: unknown): LineItem[] {
  if (!Array.isArray(value)) return [];

  return value.map((rawItem, index) => {
    const item = asRecord(rawItem);
    const quantity = asAmount(item.quantity, 1);
    const unitPrice = asAmount(item.unitPrice ?? item.unit_price, 0);
    const total = asAmount(item.total, quantity * unitPrice);

    return {
      material: asText(item.material ?? item.description ?? item.name, `Item ${index + 1}`),
      quantity,
      unitPrice,
      total,
    };
  });
}

export function normalizeEstimatePdfData(input: unknown): EstimatePDFData {
  const estimate = asRecord(input);
  return {
    estimateNumber: asText(estimate.estimateNumber, "EST-001"),
    customerName: asText(estimate.customerName, "Customer"),
    projectTitle: asText(estimate.projectTitle ?? estimate.title, "Project"),
    lineItems: normalizePdfLineItems(estimate.lineItems ?? estimate.items),
    subtotal: asAmount(estimate.subtotal),
    total: asAmount(estimate.total),
    createdDate: asDate(estimate.createdDate ?? estimate.createdAt),
    validUntil: optionalDate(estimate.validUntil),
    companyName: asText(estimate.companyName, DEFAULT_COMPANY_NAME),
    companyPhone: typeof estimate.companyPhone === "string" ? estimate.companyPhone : undefined,
    companyEmail: typeof estimate.companyEmail === "string" ? estimate.companyEmail : undefined,
  };
}

export function normalizeInvoicePdfData(input: unknown): InvoicePDFData {
  const invoice = asRecord(input);
  return {
    invoiceNumber: asText(invoice.invoiceNumber, "INV-001"),
    customerName: asText(invoice.customerName, "Customer"),
    projectTitle: asText(invoice.projectTitle ?? invoice.title, "Project"),
    lineItems: normalizePdfLineItems(invoice.lineItems ?? invoice.items),
    subtotal: asAmount(invoice.subtotal),
    tax: asAmount(invoice.tax),
    total: asAmount(invoice.total),
    createdDate: asDate(invoice.createdDate ?? invoice.issueDate ?? invoice.createdAt),
    dueDate: optionalDate(invoice.dueDate),
    companyName: asText(invoice.companyName, DEFAULT_COMPANY_NAME),
    companyPhone: typeof invoice.companyPhone === "string" ? invoice.companyPhone : undefined,
    companyEmail: typeof invoice.companyEmail === "string" ? invoice.companyEmail : undefined,
    paymentTerms: asText(invoice.paymentTerms, "Net 30"),
  };
}

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function renderPdf(options: {
  title: "ESTIMATE" | "INVOICE";
  numberLabel: "Estimate" | "Invoice";
  number: string;
  customerName: string;
  projectTitle: string;
  lineItems: LineItem[];
  subtotal: number;
  tax?: number;
  total: number;
  createdDate: Date;
  dueDate?: Date;
  validUntil?: Date;
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
  paymentTerms?: string;
  filename: string;
}): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const detailsY = margin + 35;

  doc.setFontSize(20);
  doc.setTextColor(10, 22, 40);
  doc.text(options.companyName || DEFAULT_COMPANY_NAME, margin, margin + 10);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  if (options.companyPhone) doc.text(`Phone: ${options.companyPhone}`, margin, margin + 18);
  if (options.companyEmail) doc.text(`Email: ${options.companyEmail}`, margin, margin + 24);

  doc.setFontSize(16);
  doc.setTextColor(10, 22, 40);
  doc.text(options.title, pageWidth - margin - 40, margin + 10);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`${options.numberLabel} #: ${options.number}`, margin, detailsY);
  doc.text(`Date: ${options.createdDate.toLocaleDateString()}`, margin, detailsY + 7);
  if (options.dueDate) doc.text(`Due Date: ${options.dueDate.toLocaleDateString()}`, margin, detailsY + 14);
  if (options.validUntil) doc.text(`Valid Until: ${options.validUntil.toLocaleDateString()}`, margin, detailsY + 14);

  doc.setFontSize(11);
  doc.setTextColor(10, 22, 40);
  doc.text("Bill To:", margin, detailsY + 25);
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(options.customerName, margin, detailsY + 32);
  doc.text(`Project: ${options.projectTitle}`, margin, detailsY + 39);

  const tableStartY = detailsY + 50;
  autoTable(doc, {
    head: [["Description", "Quantity", "Unit Price", "Total"]],
    body: options.lineItems.map((item) => [
      item.material,
      String(item.quantity),
      money(item.unitPrice),
      money(item.total),
    ]),
    startY: tableStartY,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [10, 22, 40], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 11 },
    bodyStyles: { textColor: [60, 60, 60], fontSize: 10 },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" } },
  });

  const finalY = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? tableStartY + 12) + 15;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Subtotal: ${money(options.subtotal)}`, pageWidth - margin - 50, finalY);
  if (options.tax && options.tax > 0) doc.text(`Tax: ${money(options.tax)}`, pageWidth - margin - 50, finalY + 7);

  doc.setFontSize(12);
  doc.setTextColor(10, 22, 40);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${money(options.total)}`, pageWidth - margin - 50, finalY + (options.tax && options.tax > 0 ? 14 : 7));

  if (options.paymentTerms) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Payment Terms: ${options.paymentTerms}`, margin, finalY + 20);
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 10, { align: "center" });
  doc.save(options.filename);
}

export function generateEstimatePDF(estimate: unknown): void {
  const data = normalizeEstimatePdfData(estimate);
  renderPdf({
    title: "ESTIMATE",
    numberLabel: "Estimate",
    number: data.estimateNumber,
    customerName: data.customerName,
    projectTitle: data.projectTitle,
    lineItems: data.lineItems,
    subtotal: data.subtotal,
    total: data.total,
    createdDate: data.createdDate,
    validUntil: data.validUntil,
    companyName: data.companyName,
    companyPhone: data.companyPhone,
    companyEmail: data.companyEmail,
    filename: `estimate-${data.estimateNumber}.pdf`,
  });
}

export function generateInvoicePDF(invoice: unknown): void {
  const data = normalizeInvoicePdfData(invoice);
  renderPdf({
    title: "INVOICE",
    numberLabel: "Invoice",
    number: data.invoiceNumber,
    customerName: data.customerName,
    projectTitle: data.projectTitle,
    lineItems: data.lineItems,
    subtotal: data.subtotal,
    tax: data.tax,
    total: data.total,
    createdDate: data.createdDate,
    dueDate: data.dueDate,
    companyName: data.companyName,
    companyPhone: data.companyPhone,
    companyEmail: data.companyEmail,
    paymentTerms: data.paymentTerms,
    filename: `invoice-${data.invoiceNumber}.pdf`,
  });
}
