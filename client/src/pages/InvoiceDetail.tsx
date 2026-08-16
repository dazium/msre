import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Download, Mail, ChevronLeft } from "lucide-react";
import { generateInvoicePDF } from "@/lib/pdf-export";
import { toast } from "sonner";

export default function InvoiceDetail() {
  const params = useParams();
  const invoiceId = params.id ? parseInt(params.id) : null;
  const [, navigate] = useLocation();
  const [emailRecipient, setEmailRecipient] = useState("");
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  const { data: invoice, isLoading } = trpc.invoices.getById.useQuery(
    { id: invoiceId || 0 },
    { enabled: !!invoiceId }
  );

  const sendEmailMutation = trpc.invoices.sendEmail.useMutation({
    onSuccess: () => {
      toast.success("Invoice email sent");
      setIsEmailDialogOpen(false);
      setEmailRecipient("");
    },
    onError: (error) => {
      console.error("Failed to send email:", error.message);
      toast.error("Could not send invoice email", { description: error.message });
    },
  });

  const handleExportPDF = () => {
    if (!invoice) return;
    try {
      generateInvoicePDF(invoice);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("Failed to export invoice PDF", error);
      toast.error("Could not export invoice PDF", { description: "Please try again." });
    }
  };

  const handleSendEmail = () => {
    if (!invoiceId || !emailRecipient) return;
    sendEmailMutation.mutate({
      id: invoiceId,
      recipientEmail: emailRecipient,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Invoice not found</p>
      </div>
    );
  }

  const subtotal = parseFloat(invoice.subtotal);
  const tax = parseFloat(invoice.tax || "0");
  const total = parseFloat(invoice.total);
  const amountPaid = parseFloat(invoice.amountPaid || "0");
  const amountDue = total - amountPaid;

  const statusColor =
    invoice.status === "paid"
      ? "bg-green-100 text-green-800"
      : invoice.status === "overdue"
        ? "bg-red-100 text-red-800"
        : invoice.status === "sent"
          ? "bg-blue-100 text-blue-800"
          : "bg-gray-100 text-gray-800";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/invoices")}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Invoices
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground mt-1">
            Issued on {format(new Date(invoice.issueDate), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Mail className="w-4 h-4" />
                Send Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Invoice via Email</DialogTitle>
                <DialogDescription>
                  Enter the recipient's email address to send this invoice
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Recipient Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="customer@example.com"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleSendEmail}
                  disabled={sendEmailMutation.isPending || !emailRecipient}
                  className="w-full"
                >
                  {sendEmailMutation.isPending ? "Sending..." : "Send Invoice"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className={`px-4 py-2 rounded-lg font-medium ${statusColor}`}>
        Status: {invoice.status.toUpperCase()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="font-medium">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issue Date</p>
              <p className="font-medium">{format(new Date(invoice.issueDate), "MMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{format(new Date(invoice.dueDate), "MMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{invoice.status}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <p className="text-muted-foreground">Subtotal</p>
              <p className="font-medium">${subtotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-muted-foreground">HST (13%)</p>
              <p className="font-medium">${tax.toFixed(2)}</p>
            </div>
            <div className="border-t pt-4 flex justify-between">
              <p className="font-semibold">Total</p>
              <p className="font-semibold text-lg">${total.toFixed(2)}</p>
            </div>
            {amountPaid > 0 && (
              <>
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Amount Paid</p>
                  <p className="font-medium text-green-600">${amountPaid.toFixed(2)}</p>
                </div>
                <div className="border-t pt-4 flex justify-between">
                  <p className="font-semibold">Amount Due</p>
                  <p className={`font-semibold text-lg ${amountDue > 0 ? "text-red-600" : "text-green-600"}`}>
                    ${amountDue.toFixed(2)}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
