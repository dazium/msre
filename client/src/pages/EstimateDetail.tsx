import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Edit2, Send, Download, Trash2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { FormField } from "@/components/FormField";
import { FormError } from "@/components/FormError";
import { validateField, validators, errorsToMap, type ValidationError } from "@/lib/validation";
// import { generateEstimatePDF } from "@/lib/pdf-export";

export default function EstimateDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [estimate, setEstimate] = useState<any>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: estimateData, isLoading } = trpc.estimates.getById.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id }
  );
  const { data: materialsData } = trpc.materials.list.useQuery();
  const { data: lineItemsData } = trpc.estimateLineItems.list.useQuery(
    { estimateId: parseInt(id || "0") },
    { enabled: !!id }
  );

  const updateMutation = trpc.estimates.update.useMutation();
  const deleteEstimateMutation = trpc.estimates.delete.useMutation();
  const updateStatusMutation = trpc.estimates.updateStatus.useMutation();

  useEffect(() => {
    if (estimateData) {
      setEstimate(estimateData);
      setEditTitle(estimateData.title);
      setEditDescription(estimateData.description || "");
      setNewStatus(estimateData.status);
    }
  }, [estimateData]);

  useEffect(() => {
    if (lineItemsData) {
      setLineItems(lineItemsData);
    }
  }, [lineItemsData]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { materialId: null, quantity: 1, unitPrice: 0, description: "" }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    if (field === "quantity") {
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    } else if (field === "unitPrice") {
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setLineItems(updated);
  };

  const calculateLineItemTotal = (item: any) => {
    return (item.quantity * item.unitPrice).toFixed(2);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2);
  };

  const calculateTotal = () => {
    const subtotal = parseFloat(calculateSubtotal());
    const tax = subtotal * 0.13;
    return (subtotal + tax).toFixed(2);
  };

  const handleSaveEstimate = async () => {
    setFormErrors({});
    const errors: ValidationError[] = [];

    const titleError = validateField(editTitle, [
      validators.required("Title"),
      validators.minLength("Title", 3),
    ]);
    if (titleError) {
      errors.push({ field: "title", message: titleError });
    }

    if (lineItems.length === 0) {
      errors.push({ field: "lineItems", message: "Please add at least one line item" });
    }

    if (errors.length > 0) {
      setFormErrors(errorsToMap(errors));
      toast.error(`Please fix ${errors.length} validation error(s)`);
      return;
    }

    setIsSubmitting(true);
    try {
      const subtotal = calculateSubtotal();
      const total = calculateTotal();

      await updateMutation.mutateAsync({
        id: parseInt(id || "0"),
        title: editTitle,
        description: editDescription,
        subtotal: subtotal,
        total: total,
      });

      toast.success("Estimate updated successfully");
      setShowEditDialog(false);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update estimate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: parseInt(id || "0"),
        status: status as "draft" | "sent" | "accepted" | "rejected",
      });
      setNewStatus(status);
      toast.success(`Estimate marked as ${status}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update estimate status");
    }
  };

  const handleDeleteEstimate = async () => {
    if (!confirm("Are you sure you want to delete this estimate?")) return;

    try {
      await deleteEstimateMutation.mutateAsync({ id: parseInt(id || "0") });
      toast.success("Estimate deleted successfully");
      setLocation("/estimates");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete estimate");
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading estimate...</div>;
  }

  if (!estimate) {
    return <div className="p-8">Estimate not found</div>;
  }

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
    sent: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    accepted: "bg-green-500/20 text-green-700 dark:text-green-300",
    rejected: "bg-red-500/20 text-red-700 dark:text-red-300",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/estimates")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{estimate.estimateNumber}</h1>
            <p className="text-muted-foreground">{estimate.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowEditDialog(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Status Section */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${statusColors[newStatus]}`}>
              {newStatus}
            </span>
            <Select value={newStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineItems.length === 0 ? (
            <p className="text-muted-foreground">No line items</p>
          ) : (
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center p-3 bg-muted/30 rounded border">
                  <div className="text-sm">
                    <p className="font-medium">{item.material?.name || item.description || "Item"}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">${item.unitPrice.toFixed(2)}</p>
                  </div>
                  <div className="text-sm font-semibold">
                    ${calculateLineItemTotal(item)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLineItem(index)}
                    className="justify-self-end"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-right">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${calculateSubtotal()}</span>
            </div>
            <div className="flex justify-between">
              <span>HST (13%):</span>
              <span>${(parseFloat(calculateSubtotal()) * 0.13).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${calculateTotal()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-full sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle>Edit Estimate</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <FormField
                label="Title"
                name="title"
                placeholder="e.g., Roof Replacement"
                value={editTitle}
                onChange={(v) => setEditTitle(v.toString())}
                error={formErrors.title}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add any additional details"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>

            {/* Line Items Edit */}
            <div className="border-t pt-4">
              {formErrors.lineItems && <FormError message={formErrors.lineItems} />}
              <div className="flex justify-between items-center mb-4">
                <Label className="text-base font-semibold">Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end p-3 bg-muted/30 rounded border">
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, "quantity", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleLineItemChange(index, "unitPrice", e.target.value)}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-semibold">${calculateLineItemTotal(item)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLineItem(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSaveEstimate} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="destructive" onClick={handleDeleteEstimate} disabled={isSubmitting}>
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
