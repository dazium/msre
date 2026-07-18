
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, MapPin, Phone, Mail } from "lucide-react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { ContactLink } from "@/components/ContactLink";
import { AddressMapModal } from "@/components/AddressMapModal";

export default function Customers() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    latitude: "",
    longitude: "",
    notes: "",
  });

  const { data: customers, isLoading, refetch } = trpc.customers.list.useQuery();
  const createMutation = trpc.customers.create.useMutation();
  const updateMutation = trpc.customers.update.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      toast.success("Customer added successfully");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        latitude: "",
        longitude: "",
        notes: "",
      });
      setIsOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to add customer");
    }
  };

  const handleStatusChange = async (customerId: number, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({
        id: customerId,
        status: newStatus as any,
      });
      toast.success("Status updated");
      refetch();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const filteredCustomers = customers?.filter((c) => {
    const matchesSearch =
      c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
    <div className="space-y-6">
        {/* Header */}
        <div className="blueprint-section">
          <div className="blueprint-header flex items-center justify-between">
            <h1 className="text-3xl font-bold">Customers</h1>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-full sm:max-w-2xl w-[95vw] sm:w-auto max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <AddressAutocomplete
                      value={formData.address}
                      onChange={(address) => setFormData({ ...formData, address })}
                      onLocationSelect={(location) =>
                        setFormData({
                          ...formData,
                          address: location.address,
                          city: location.city,
                          state: location.state,
                          zipCode: location.zipCode,
                          latitude: location.latitude,
                          longitude: location.longitude,
                        })
                      }
                      placeholder="123 Main St, Windsor, ON"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Windsor"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="ON"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        placeholder="P0X 1X0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Add any notes about this customer..."
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Adding..." : "Add Customer"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="blueprint-section">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Customers List */}
        <div className="blueprint-section">
          <div className="p-6">
            {isLoading ? (
              <p className="text-center py-8 text-foreground/60">Loading customers...</p>
            ) : filteredCustomers?.length === 0 ? (
              <p className="text-center py-8 text-foreground/60">
                {customers?.length === 0 ? "No customers yet. Add one to get started!" : "No customers match your search."}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredCustomers?.map((customer) => (
                  <div key={customer.id} className="blueprint-card p-4 hover:blueprint-glow transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {customer.firstName} {customer.lastName}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-sm text-foreground/70">
                          {customer.phone && (
                            <ContactLink type="phone" value={customer.phone} />
                          )}
                          {customer.email && (
                            <ContactLink type="email" value={customer.email} />
                          )}
                          {customer.address && (
                            <ContactLink
                              type="address"
                              value={customer.address}
                              label={`${customer.city}, ${customer.state}`}
                              onAddressClick={(addr) => {
                                setSelectedAddress(addr);
                                setMapOpen(true);
                              }}
                            />
                          )}
                        </div>
                        <p className="text-xs text-foreground/50 mt-2">{customer.notes}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Select value={customer.status} onValueChange={(val) => handleStatusChange(customer.id, val)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                            <SelectItem value="won">Won</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    <AddressMapModal
      address={selectedAddress}
      isOpen={mapOpen}
      onClose={() => setMapOpen(false)}
    />
    </>
  );
}
