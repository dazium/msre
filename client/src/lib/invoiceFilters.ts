export type InvoiceFilterRecord = {
  invoiceNumber?: string | null;
  status?: string | null;
};

export function filterInvoices<T extends InvoiceFilterRecord>(
  invoices: T[],
  searchTerm: string,
  status: string | null,
): T[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  return invoices.filter((invoice) => {
    const matchesSearch = !normalizedSearch || (invoice.invoiceNumber ?? "").toLowerCase().includes(normalizedSearch);
    const matchesStatus = !status || invoice.status === status;
    return matchesSearch && matchesStatus;
  });
}
