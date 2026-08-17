import nodemailer from "nodemailer";
import { Invoice } from "../drizzle/schema";

/**
 * Email configuration - uses environment variables
 * For development, uses a test account from Ethereal Email
 * For production, configure with your email service credentials
 */
let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  // Keep automated tests fully local, deterministic, and independent of an SMTP service.
  if (process.env.NODE_ENV === "test") {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }

  // Development uses an Ethereal account. Production delivery credentials are configured by deployment.
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return transporter;
}

interface EmailInvoiceData {
  invoice: Invoice;
  recipientEmail: string;
  recipientName: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
}

/**
 * Send invoice via email with PDF attachment
 */
export async function sendInvoiceEmail(data: EmailInvoiceData): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
  try {
    const transporter = await getTransporter();

    const mailOptions = {
      from: '"Rooftop Renovators" <noreply@rooftoprenovators.com>',
      to: data.recipientEmail,
      subject: `Invoice ${data.invoice.invoiceNumber} from Rooftop Renovators`,
      html: generateEmailTemplate(data.invoice, data.recipientName),
      attachments: [
        {
          filename: data.pdfFilename,
          content: data.pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);

    // For test accounts, generate preview URL
    let previewUrl: string | undefined;
    if (process.env.NODE_ENV !== "production") {
      const url = nodemailer.getTestMessageUrl(info);
      previewUrl = url || (process.env.NODE_ENV === "test" ? `test://email/${info.messageId}` : undefined);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    return {
      success: false,
    };
  }
}

/**
 * Generate HTML email template for invoice
 */
function generateEmailTemplate(invoice: Invoice, recipientName: string): string {
  const subtotal = parseFloat(invoice.subtotal);
  const tax = parseFloat(invoice.tax || "0");
  const total = parseFloat(invoice.total);
  const amountPaid = parseFloat(invoice.amountPaid || "0");
  const amountDue = total - amountPaid;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background-color: #1a3a52;
            color: white;
            padding: 20px;
            border-radius: 5px 5px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .header p {
            margin: 5px 0 0 0;
            font-size: 14px;
          }
          .content {
            background-color: white;
            padding: 20px;
            border: 1px solid #ddd;
          }
          .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
          }
          .detail-group h3 {
            margin: 0 0 10px 0;
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
          }
          .detail-group p {
            margin: 5px 0;
            font-size: 14px;
          }
          .totals {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .total-row.final {
            font-size: 16px;
            font-weight: bold;
            color: #1a3a52;
            border-top: 2px solid #ddd;
            padding-top: 10px;
          }
          .status {
            padding: 10px;
            border-radius: 5px;
            margin: 15px 0;
            font-weight: bold;
            text-align: center;
          }
          .status.paid {
            background-color: #d4edda;
            color: #155724;
          }
          .status.pending {
            background-color: #fff3cd;
            color: #856404;
          }
          .status.overdue {
            background-color: #f8d7da;
            color: #721c24;
          }
          .footer {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 0 0 5px 5px;
            border: 1px solid #ddd;
            border-top: none;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          .cta-button {
            display: inline-block;
            background-color: #1a3a52;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ROOFTOP RENOVATORS</h1>
            <p>Professional Roofing Services</p>
          </div>

          <div class="content">
            <p>Hello ${recipientName},</p>

            <p>We're pleased to send you the attached invoice for your recent roofing project. Please review the details below.</p>

            <div class="invoice-details">
              <div class="detail-group">
                <h3>Invoice Number</h3>
                <p>${invoice.invoiceNumber}</p>
              </div>
              <div class="detail-group">
                <h3>Invoice Date</h3>
                <p>${formatDate(invoice.issueDate)}</p>
              </div>
              <div class="detail-group">
                <h3>Due Date</h3>
                <p>${formatDate(invoice.dueDate)}</p>
              </div>
              <div class="detail-group">
                <h3>Status</h3>
                <p>${invoice.status.toUpperCase()}</p>
              </div>
            </div>

            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>$${subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>HST (13%):</span>
                <span>$${tax.toFixed(2)}</span>
              </div>
              <div class="total-row final">
                <span>Total Amount:</span>
                <span>$${total.toFixed(2)}</span>
              </div>
              ${amountPaid > 0 ? `
              <div class="total-row">
                <span>Amount Paid:</span>
                <span>$${amountPaid.toFixed(2)}</span>
              </div>
              <div class="total-row final">
                <span>Amount Due:</span>
                <span>$${amountDue.toFixed(2)}</span>
              </div>
              ` : ""}
            </div>

            <div class="status ${invoice.status === "paid" ? "paid" : invoice.status === "overdue" ? "overdue" : "pending"}">
              ${invoice.status === "paid" ? "✓ PAID" : invoice.status === "overdue" ? "⚠ OVERDUE" : "PAYMENT PENDING"}
            </div>

            ${invoice.notes ? `
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0;">Notes:</h3>
              <p>${invoice.notes}</p>
            </div>
            ` : ""}

            <p>Please find the complete invoice attached as a PDF. If you have any questions about this invoice, please don't hesitate to contact us.</p>

            <a href="mailto:info@rooftoprenovators.com" class="cta-button">Contact Us</a>

            <p style="margin-top: 30px; font-size: 12px; color: #999;">
              Thank you for choosing Rooftop Renovators for your roofing needs!
            </p>
          </div>

          <div class="footer">
            <p>© 2026 Rooftop Renovators. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly to this address.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Format date for email display
 */
function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
