import { Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContactLinkProps {
  type: "phone" | "email" | "address";
  value: string;
  label?: string;
  onAddressClick?: (address: string) => void;
}

export function ContactLink({ type, value, label, onAddressClick }: ContactLinkProps) {
  if (!value) return null;

  if (type === "phone") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 text-left hover:text-primary"
        onClick={() => (window.location.href = `tel:${value}`)}
      >
        <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
        <span>{label || value}</span>
      </Button>
    );
  }

  if (type === "email") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 text-left hover:text-primary"
        onClick={() => (window.location.href = `mailto:${value}`)}
      >
        <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
        <span>{label || value}</span>
      </Button>
    );
  }

  if (type === "address") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 text-left hover:text-primary"
        onClick={() => onAddressClick?.(value)}
      >
        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
        <span>{label || value}</span>
      </Button>
    );
  }

  return null;
}
