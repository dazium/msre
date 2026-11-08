import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

type CustomerOption = {
  id: number;
  firstName: string;
  lastName: string;
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
};

type CustomerPickerProps = {
  value: number | null;
  onChange: (customerId: number | null) => void;
  label?: string;
  placeholder?: string;
};

export function CustomerPicker({
  value,
  onChange,
  label = "Customer",
  placeholder = "Search name, company, phone, or email…",
}: CustomerPickerProps) {
  const [query, setQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { data: matches = [], isFetching } = trpc.customers.search.useQuery(
    { query: query.trim(), limit: 8 },
    { enabled: isOpen, staleTime: 30_000 },
  );
  const displayValue = value !== null ? selectedLabel : query;

  return (
    <div className="relative space-y-2">
      <Label>{label}</Label>
      <Input
        value={displayValue}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          if (value !== null) {
            onChange(null);
            setSelectedLabel("");
          }
          setIsOpen(true);
        }}
        onBlur={() => setTimeout(() => setIsOpen(false), 120)}
        aria-expanded={isOpen}
        aria-label={label}
      />
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg">
          {isFetching ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Searching customers…</p>
          ) : matches.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No matching customers found.</p>
          ) : matches.map((customer: CustomerOption) => (
            <button
              key={customer.id}
              type="button"
              className="flex w-full flex-col rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(customer.id);
                setSelectedLabel([customer.firstName, customer.lastName].filter(Boolean).join(" ") + (customer.companyName ? ` · ${customer.companyName}` : ""));
                setQuery("");
                setIsOpen(false);
              }}
            >
              <span className="font-medium">{customer.firstName} {customer.lastName}{customer.companyName ? ` · ${customer.companyName}` : ""}</span>
              <span className="text-xs text-muted-foreground">{[customer.phone, customer.email, customer.city].filter(Boolean).join(" · ")}</span>
            </button>
          ))}
        </div>
      )}
      {value !== null && (
        <button type="button" className="text-xs text-muted-foreground underline" onClick={() => { onChange(null); setSelectedLabel(""); setQuery(""); }}>
          Clear customer
        </button>
      )}
    </div>
  );
}
