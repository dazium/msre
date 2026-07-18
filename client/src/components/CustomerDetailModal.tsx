import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Phone, Mail, MapPin, X } from "lucide-react";
import { useState } from "react";
import { ContactLink } from "@/components/ContactLink";
import { AddressMapModal } from "@/components/AddressMapModal";

interface CustomerDetailModalProps {
  customerId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerDetailModal({ customerId, isOpen, onClose }: CustomerDetailModalProps) {
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const { data: customer } = trpc.customers.getById.useQuery(
    { id: customerId || 0 },
    { enabled: !!customerId }
  );

  const { data: projects } = trpc.projects.listByCustomer.useQuery(
    { customerId: customerId || 0 },
    { enabled: !!customerId }
  );

  if (!customer) return null;

  const statusColors: Record<string, string> = {
    lead: "bg-blue-500/20 text-blue-400",
    won: "bg-green-500/20 text-green-400",
    lost: "bg-red-500/20 text-red-400",
  };

  const projectStatusColors: Record<string, string> = {
    planning: "bg-yellow-500/20 text-yellow-400",
    in_progress: "bg-blue-500/20 text-blue-400",
    completed: "bg-green-500/20 text-green-400",
    on_hold: "bg-gray-500/20 text-gray-400",
  };

  const handleAddressClick = (address: string) => {
    setSelectedAddress(address);
    setMapOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-full sm:max-w-2xl w-[95vw] sm:w-auto max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="break-words">{customer.firstName} {customer.lastName}</span>
              <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <ContactLink
                    type="phone"
                    value={customer.phone}
                    label={customer.phone}
                  />
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <ContactLink
                      type="email"
                      value={customer.email}
                      label={customer.email}
                    />
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-2 md:col-span-2">
                    <ContactLink
                      type="address"
                      value={customer.address}
                      label={`${customer.address}, ${customer.city}, ${customer.state} ${customer.zipCode}`}
                      onAddressClick={handleAddressClick}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-xs text-foreground/60">Status</p>
                    <Badge className={statusColors[customer.status] || "bg-gray-500/20 text-gray-400"}>
                      {customer.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Projects ({projects?.length || 0})</h3>
              {projects && projects.length > 0 ? (
                <div className="space-y-2">
                  {projects.map((project: any) => (
                    <div
                      key={project.id}
                      className="p-4 border border-border rounded-lg bg-background/50 hover:bg-background transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{project.title}</p>
                          <p className="text-xs text-foreground/60 mt-1">{project.description}</p>
                        </div>
                        <Badge className={projectStatusColors[project.status] || "bg-gray-500/20 text-gray-400"}>
                          {project.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-foreground/60 mt-3">
                        <span>
                          Created: {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        {project.estimatedCompletion && (
                          <span>
                            Est. Completion: {new Date(project.estimatedCompletion).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-foreground/60 text-center py-4">
                  No projects yet. Create a new project for this customer.
                </p>
              )}
            </div>

            {/* Notes */}
            {customer.notes && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Notes</h3>
                <p className="text-sm text-foreground/80 bg-background/50 p-3 rounded border border-border">
                  {customer.notes}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddressMapModal
        address={selectedAddress}
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
      />
    </>
  );
}
