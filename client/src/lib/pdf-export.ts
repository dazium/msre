import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface LineItem {
  material: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface EstimatePDFData {
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

export function generateEstimatePDF(data: EstimatePDFData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Header - Company Info
  doc.setFontSize(20);
  doc.setTextColor(10, 22, 40); // Deep blue
  doc.text(data.companyName || "Rooftop Renovators", margin, margin + 10);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  if (data.companyPhone) {
    doc.text(`Phone: ${data.companyPhone}`, margin, margin + 18);
  }
  if (data.companyEmail) {
    doc.text(`Email: ${data.companyEmail}`, margin, margin + 24);
  }

  // Title
  doc.setFontSize(16);
  doc.setTextColor(10, 22, 40);
  doc.text("ESTIMATE", pageWidth - margin - 40, margin + 10);

  // Estimate Details
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const detailsY = margin + 35;
  doc.text(`Estimate #: ${data.estimateNumber}`, margin, detailsY);
  doc.text(`Date: ${new Date(data.createdDate).toLocaleDateString()}`, margin, detailsY + 7);
  if (data.validUntil) {
    doc.text(`Valid Until: ${new Date(data.validUntil).toLocaleDateString()}`, margin, detailsY + 14);
  }

  // Customer Info
  doc.setFontSize(11);
  doc.setTextColor(10, 22, 40);
  doc.text("Bill To:", margin, detailsY + 25);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(data.customerName, margin, detailsY + 32);
  doc.text(`Project: ${data.projectTitle}`, margin, detailsY + 39);

  // Line Items Table
  const tableStartY = detailsY + 50;
  const tableData = [
    ["Material", "Quantity", "Unit Price", "Total"],
    ...data.lineItems.map(item => [
      item.material,
      item.quantity.toString(),
      `$${item.unitPrice.toFixed(2)}`,
      `$${item.total.toFixed(2)}`,
    ]),
  ];

  (doc as any).autoTable({
    head: [tableData[0]],
    body: tableData.slice(1),
    startY: tableStartY,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: {
      fillColor: [10, 22, 40],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 11,
    },
    bodyStyles: {
      textColor: [60, 60, 60],
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });

  // Totals Section
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Subtotal: $${data.subtotal.toFixed(2)}`, pageWidth - margin - 50, finalY);

  doc.setFontSize(12);
  doc.setTextColor(10, 22, 40);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: $${data.total.toFixed(2)}`, pageWidth - margin - 50, finalY + 10);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Thank you for your business!",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  // Save PDF
  const filename = data.estimateNumber ? `estimate-${data.estimateNumber}.pdf` : "estimate.pdf";
  doc.save(filename);
}
