import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";

interface LineItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: string;
  total: number;
}

export default function EstimateForm({ projectId, customerId }: { projectId: number; customerId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    validUntil: "",
    estimateNumber: "EST-001",
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [newItem, setNewItem] = useState<LineItem>({
    description: "",
    quantity: 1,
    unitPrice: "0",
    total: 0,
  });

  const createMutation = trpc.estimates.create.useMutation();
  const { refetch: refetchEstimates } = trpc.estimates.list.useQuery();

  const calculateTotal = (quantity: number, unitPrice: string): number => {
    return quantity * (parseFloat(unitPrice) || 0);
  };

  const handleAddLineItem = () => {
    if (!newItem.description.trim()) return;
    
    const total = calculateTotal(newItem.quantity, newItem.unitPrice);
    setLineItems([...lineItems, { ...newItem, total }]);
    setNewItem({ description: "", quantity: 1, unitPrice: "0", total: 0 });
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const tax = parseFloat(formData.description) * subtotal / 100 || 0;
  const total = subtotal + tax;

  const handleSubmit = async () => {
    if (!formData.title.trim() || lineItems.length === 0) {
      alert("Please fill in title and add at least one line item");
      return;
    }

    try {
      await createMutation.mutateAsync({
        projectId,
        customerId,
        estimateNumber: formData.estimateNumber,
        title: formData.title,
        description: formData.description,
        subtotal: subtotal.toString(),
        total: total.toString(),
      });
      setIsOpen(false);
      setFormData({ title: "", description: "", validUntil: "", estimateNumber: "EST-001" });
      setLineItems([]);
      refetchEstimates();
    } catch (error) {
      console.error("Error creating estimate:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Estimate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Estimate</DialogTitle>
          <DialogDescription>Create a new estimate with line items</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estimate Header */}
          <div className="space-y-4">
            <div>
              <Label>Estimate Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Roof Replacement - Main House"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the work to be done..."
                rows={3}
              />
            </div>
            <div>
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              />
            </div>
          </div>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Item */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="text"
                      value={newItem.quantity.toString()}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="text"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
                    placeholder="0.00"
                  />
                  </div>
                  <div className="col-span-2 flex items-end">
                  <Button onClick={handleAddLineItem} className="w-full">
                    Add
                  </Button>
                  </div>
                </div>
              </div>

              {/* Line Items List */}
              {lineItems.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 font-semibold text-sm p-2 bg-gray-100 rounded">
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Unit Price</div>
                    <div className="col-span-2">Total</div>
                    <div className="col-span-1"></div>
                  </div>
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-2 border rounded">
                      <div className="col-span-5">{item.description}</div>
                      <div className="col-span-2">{item.quantity}</div>
                      <div className="col-span-2">${parseFloat(item.unitPrice).toFixed(2)}</div>
                      <div className="col-span-2">${item.total.toFixed(2)}</div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLineItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No line items added yet</p>
              )}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2 text-right">
                <div className="flex justify-end gap-4">
                  <span>Subtotal:</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-end gap-4">
                  <span>Tax:</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-end gap-4 text-lg border-t pt-2">
                  <span>Total:</span>
                  <span className="font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Estimate"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
