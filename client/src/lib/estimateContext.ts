export type EstimateCustomerContext = {
  customerName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  jobTitle: string;
  jobDescription?: string | null;
  jobStatus?: string | null;
  roofType?: string | null;
};

export type EstimatePrefill = {
  title: string;
  description: string;
  contact: Array<{ label: "Customer" | "Phone" | "Email" | "Address"; value: string }>;
};

const formatStatus = (status?: string | null) => status ? status.replaceAll("_", " ") : "Not set";

export function buildCustomerEstimatePrefill(context: EstimateCustomerContext): EstimatePrefill {
  const address = [context.address, context.city, context.state, context.zipCode]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(", ");
  const contact = [
    { label: "Customer" as const, value: context.customerName },
    ...(context.phone ? [{ label: "Phone" as const, value: context.phone }] : []),
    ...(context.email ? [{ label: "Email" as const, value: context.email }] : []),
    ...(address ? [{ label: "Address" as const, value: address }] : []),
  ];
  const jobLines = [
    `Customer: ${context.customerName}`,
    `Phone: ${context.phone || "Not provided"}`,
    `Email: ${context.email || "Not provided"}`,
    `Address: ${address || "Not provided"}`,
    "",
    `Job: ${context.jobTitle}`,
    `Status: ${formatStatus(context.jobStatus)}`,
    ...(context.roofType ? [`Roof type: ${context.roofType}`] : []),
    ...(context.jobDescription ? ["", "Recent job notes:", context.jobDescription] : []),
  ];

  return {
    title: `${context.jobTitle} — ${context.customerName}`,
    description: jobLines.join("\n"),
    contact,
  };
}
