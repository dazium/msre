import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Check } from "lucide-react";

export default function InvoiceTemplates() {
  const { data: templates, isLoading, refetch } = trpc.invoiceTemplates.list.useQuery();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isDefault: false,
    companyName: "",
    companyLogo: "",
    companyPhone: "",
    companyEmail: "",
    companyAddress: "",
    primaryColor: "#1a3a52",
    secondaryColor: "#ffffff",
    accentColor: "#4a90e2",
    footerText: "",
    paymentTerms: "",
    includeCompanyLogo: true,
    includeCompanyInfo: true,
    includePaymentTerms: true,
  });

  const createMutation = trpc.invoiceTemplates.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = trpc.invoiceTemplates.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = trpc.invoiceTemplates.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isDefault: false,
      companyName: "",
      companyLogo: "",
      companyPhone: "",
      companyEmail: "",
      companyAddress: "",
      primaryColor: "#1a3a52",
      secondaryColor: "#ffffff",
      accentColor: "#4a90e2",
      footerText: "",
      paymentTerms: "",
      includeCompanyLogo: true,
      includeCompanyInfo: true,
      includePaymentTerms: true,
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, ...formData });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoice Templates</h1>
          <p className="text-muted-foreground mt-1">Manage your invoice layouts and branding</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Invoice Template</DialogTitle>
              <DialogDescription>
                Create a new invoice template with custom branding and layout options
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Standard, Premium, Minimal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this template..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked as boolean })}
                />
                <Label htmlFor="isDefault">Set as default template</Label>
              </div>

              {/* Company Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Company Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Rooftop Renovators"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Phone</Label>
                    <Input
                      id="companyPhone"
                      placeholder="(555) 123-4567"
                      value={formData.companyPhone}
                      onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Email</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      placeholder="info@company.com"
                      value={formData.companyEmail}
                      onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="companyAddress">Address</Label>
                  <Textarea
                    id="companyAddress"
                    placeholder="123 Main St, City, State 12345"
                    value={formData.companyAddress}
                    onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  />
                </div>
              </div>

              {/* Colors */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Colors</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="w-12 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="w-12 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={formData.accentColor}
                        onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                        className="w-12 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.accentColor}
                        onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer & Terms */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Footer & Terms</h3>

                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Textarea
                    id="footerText"
                    placeholder="Thank you for your business!"
                    value={formData.footerText}
                    onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Textarea
                    id="paymentTerms"
                    placeholder="Payment due within 30 days of invoice date..."
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  />
                </div>
              </div>

              {/* Layout Options */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Layout Options</h3>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="includeCompanyLogo"
                      checked={formData.includeCompanyLogo}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, includeCompanyLogo: checked as boolean })
                      }
                    />
                    <Label htmlFor="includeCompanyLogo">Include company logo</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="includeCompanyInfo"
                      checked={formData.includeCompanyInfo}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, includeCompanyInfo: checked as boolean })
                      }
                    />
                    <Label htmlFor="includeCompanyInfo">Include company info (phone, email, address)</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="includePaymentTerms"
                      checked={formData.includePaymentTerms}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, includePaymentTerms: checked as boolean })
                      }
                    />
                    <Label htmlFor="includePaymentTerms">Include payment terms</Label>
                  </div>
                </div>
              </div>

              <Button onClick={handleCreate} disabled={createMutation.isPending || !formData.name} className="w-full">
                {createMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates && templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No invoice templates yet</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
              Create your first template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates?.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {template.name}
                      {template.isDefault && (
                        <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          <Check className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </CardTitle>
                    {template.description && <CardDescription>{template.description}</CardDescription>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{template.companyName}</p>
                  {template.companyPhone && <p className="text-sm text-muted-foreground">{template.companyPhone}</p>}
                  {template.companyEmail && <p className="text-sm text-muted-foreground">{template.companyEmail}</p>}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => {
                      setFormData({
                        name: template.name,
                        description: template.description || "",
                        isDefault: template.isDefault,
                        companyName: template.companyName,
                        companyLogo: template.companyLogo || "",
                        companyPhone: template.companyPhone || "",
                        companyEmail: template.companyEmail || "",
                        companyAddress: template.companyAddress || "",
                        primaryColor: template.primaryColor,
                        secondaryColor: template.secondaryColor,
                        accentColor: template.accentColor,
                        footerText: template.footerText || "",
                        paymentTerms: template.paymentTerms || "",
                        includeCompanyLogo: template.includeCompanyLogo,
                        includeCompanyInfo: template.includeCompanyInfo,
                        includePaymentTerms: template.includePaymentTerms,
                      });
                      setEditingId(template.id);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleDelete(template.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
