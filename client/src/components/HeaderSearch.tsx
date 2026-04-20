import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SearchResult {
  id: number;
  type: "customer" | "project" | "estimate";
  title: string;
  subtitle?: string;
  path: string;
}

export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Fetch all data for searching
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: estimates } = trpc.estimates.list.useQuery();

  // Perform search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search customers
    if (customers) {
      customers.forEach((customer) => {
        const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
        if (
          fullName.includes(query) ||
          customer.email?.toLowerCase().includes(query) ||
          customer.phone?.includes(query)
        ) {
          searchResults.push({
            id: customer.id,
            type: "customer",
            title: `${customer.firstName} ${customer.lastName}`,
            subtitle: customer.phone || customer.email || undefined,
            path: "/customers",
          });
        }
      });
    }

    // Search projects
    if (projects) {
      projects.forEach((project) => {
        if (project.title.toLowerCase().includes(query)) {
          searchResults.push({
            id: project.id,
            type: "project",
            title: project.title,
            subtitle: project.description ?? undefined,
            path: "/projects",
          });
        }
      });
    }

    // Search estimates
    if (estimates) {
      estimates.forEach((estimate) => {
        if (
          estimate.title.toLowerCase().includes(query) ||
          estimate.estimateNumber.toLowerCase().includes(query)
        ) {
          searchResults.push({
            id: estimate.id,
            type: "estimate",
            title: estimate.title,
            subtitle: `#${estimate.estimateNumber}` || undefined,
            path: "/estimates",
          });
        }
      });
    }

    setResults(searchResults.slice(0, 8)); // Limit to 8 results
  }, [searchQuery, customers, projects, estimates]);

  const handleSelect = (result: SearchResult) => {
    setLocation(result.path);
    setOpen(false);
    setSearchQuery("");
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "customer":
        return "text-blue-500";
      case "project":
        return "text-green-500";
      case "estimate":
        return "text-amber-500";
      default:
        return "text-gray-500";
    }
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div ref={triggerRef} className="relative flex-1 max-w-sm mx-4">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search customers, projects, estimates..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              className="w-full pl-9 pr-9 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setResults([]);
                }}
                className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        {results.length === 0 && searchQuery ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No results found for "{searchQuery}"
          </div>
        ) : results.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            {/* Group by type */}
            {["customer", "project", "estimate"].map((type) => {
              const typeResults = results.filter((r) => r.type === type);
              if (typeResults.length === 0) return null;

              return (
                <div key={type} className="border-b last:border-b-0">
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">
                    {type === "customer"
                      ? "Customers"
                      : type === "project"
                        ? "Projects"
                        : "Estimates"}
                  </div>
                  {typeResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b last:border-b-0 focus:outline-none"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {result.title}
                          </p>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-xs font-semibold whitespace-nowrap ${getTypeColor(
                            result.type
                          )}`}
                        >
                          {getTypeLabel(result.type)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export default HeaderSearch;
