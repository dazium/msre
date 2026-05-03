# Rooftop Renovators CRM - API Reference

## Overview

All API endpoints are accessed through tRPC at `/api/trpc`. The API is fully type-safe with TypeScript and uses Zod for input validation.

## Authentication

All procedures (except public ones) require authentication via Manus OAuth. The user context is automatically injected into protected procedures.

### Protected Procedure
```typescript
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx });
});
```

## API Routers

### Authentication Router (`auth`)

#### `auth.me`
Get current user information.

**Type:** Query  
**Auth:** Protected

**Response:**
```typescript
{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}
```

#### `auth.logout`
Logout current user and clear session.

**Type:** Mutation  
**Auth:** Protected

**Response:**
```typescript
{ success: boolean }
```

---

### Customers Router (`customers`)

#### `customers.list`
Get all customers for the user.

**Type:** Query  
**Auth:** Protected

**Response:**
```typescript
Customer[]
```

#### `customers.getById`
Get a specific customer.

**Type:** Query  
**Auth:** Protected

**Input:**
```typescript
{ id: number }
```

**Response:**
```typescript
Customer | null
```

#### `customers.create`
Create a new customer.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: Decimal;
  longitude?: Decimal;
  notes?: string;
}
```

**Response:**
```typescript
Customer
```

#### `customers.update`
Update customer information.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: Decimal;
  longitude?: Decimal;
  status?: "lead" | "contacted" | "qualified" | "proposal_sent" | "won" | "lost";
  notes?: string;
}
```

**Response:**
```typescript
Customer
```

#### `customers.delete`
Delete a customer.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{ id: number }
```

---

### Projects Router (`projects`)

#### `projects.list`
Get all projects for the user.

**Type:** Query  
**Auth:** Protected

**Response:**
```typescript
Project[]
```

#### `projects.getById`
Get a specific project.

**Type:** Query  
**Auth:** Protected

**Input:**
```typescript
{ id: number }
```

**Response:**
```typescript
Project | null
```

#### `projects.create`
Create a new project.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{
  customerId: number;
  projectName: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  projectType: string;
  startDate?: Date;
  endDate?: Date;
  budget?: Decimal;
  crewId?: number;
}
```

**Response:**
```typescript
Project
```

#### `projects.update`
Update project information.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{
  id: number;
  projectName?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  projectType?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: Decimal;
  crewId?: number;
  status?: "planning" | "in_progress" | "completed" | "on_hold" | "cancelled";
}
```

**Response:**
```typescript
Project
```

#### `projects.delete`
Delete a project.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{ id: number }
```

---

### Invoices Router (`invoices`)

#### `invoices.listByProject`
Get all invoices for a project.

**Type:** Query  
**Auth:** Protected

**Input:**
```typescript
{ projectId: number }
```

**Response:**
```typescript
Invoice[]
```

#### `invoices.listByCustomer`
Get all invoices for a customer.

**Type:** Query  
**Auth:** Protected

**Input:**
```typescript
{ customerId: number }
```

**Response:**
```typescript
Invoice[]
```

#### `invoices.getById`
Get a specific invoice.

**Type:** Query  
**Auth:** Protected

**Input:**
```typescript
{ id: number }
```

**Response:**
```typescript
Invoice | null
```

#### `invoices.generateNumber`
Generate the next invoice number.

**Type:** Query  
**Auth:** Protected

**Response:**
```typescript
string // Format: INV-YYYYMM-0001
```

#### `invoices.create`
Create a new invoice.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{
  projectId: number;
  customerId: number;
  invoiceNumber?: string;
  issueDate: Date;
  dueDate: Date;
  subtotal: Decimal;
  tax: Decimal;
  total: Decimal;
  templateId?: number;
  notes?: string;
}
```

**Response:**
```typescript
Invoice
```

#### `invoices.update`
Update invoice information.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{
  id: number;
  issueDate?: Date;
  dueDate?: Date;
  subtotal?: Decimal;
  tax?: Decimal;
  total?: Decimal;
  status?: "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";
  templateId?: number;
  notes?: string;
}
```

**Response:**
```typescript
Invoice
```

#### `invoices.delete`
Delete an invoice.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{ id: number }
```

#### `invoices.exportPDF`
Generate PDF for an invoice.

**Type:** Query  
**Auth:** Protected

**Input:**
```typescript
{ id: number }
```

**Response:**
```typescript
{
  url: string;
  filename: string;
}
```

#### `invoices.sendEmail`
Send invoice via email.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{
  id: number;
  recipientEmail: string;
  message?: string;
}
```

**Response:**
```typescript
{ success: boolean; message: string }
```

---

### Payments Router (`payments`)

#### `payments.listByUser`
Get all payments for the user.

**Type:** Query  
**Auth:** Protected

**Response:**
```typescript
Payment[]
```

#### `payments.listByInvoice`
Get all payments for an invoice.

**Type:** Query  
**Auth:** Protected

**Input:**
```typescript
{ invoiceId: number }
```

**Response:**
```typescript
Payment[]
```

#### `payments.createCheckoutSession`
Create Stripe checkout session for invoice payment.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{
  invoiceId: number;
  amount: number; // in cents
  returnUrl: string;
}
```

**Response:**
```typescript
{
  sessionId: string;
  checkoutUrl: string;
}
```

#### `payments.recordPayment`
Record a manual payment.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{
  invoiceId: number;
  amount: Decimal;
  paymentMethod: string;
  transactionId?: string;
}
```

**Response:**
```typescript
Payment
```

---

### Crews Router (`crews`)

#### `crews.list`
Get all crews for the user.

**Type:** Query  
**Auth:** Protected

**Response:**
```typescript
Crew[]
```

#### `crews.getById`
Get a specific crew.

**Type:** Query  
**Auth:** Protected

**Input:**
```typescript
{ id: number }
```

**Response:**
```typescript
Crew | null
```

#### `crews.create`
Create a new crew.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{
  name: string;
  description?: string;
  crewLead?: string;
  phone?: string;
  email?: string;
}
```

**Response:**
```typescript
Crew
```

#### `crews.update`
Update crew information.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{
  id: number;
  name?: string;
  description?: string;
  crewLead?: string;
  phone?: string;
  email?: string;
  status?: "active" | "inactive";
}
```

**Response:**
```typescript
Crew
```

#### `crews.delete`
Delete a crew.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{ id: number }
```

---

### Crew Skills Router (`crewSkills`)

#### `crewSkills.getByCrew`
Get all skills for a crew.

**Type:** Query  
**Auth:** Protected

**Input:**
```typescript
{ crewId: number }
```

**Response:**
```typescript
CrewSkill[]
```

#### `crewSkills.getById`
Get a specific crew skill.

**Type:** Query  
**Auth:** Protected

**Input:**
```typescript
{ id: number }
```

**Response:**
```typescript
CrewSkill | null
```

#### `crewSkills.create`
Add a skill to a crew member.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{
  crewId: number;
  skillName: string;
  skillLevel: "beginner" | "intermediate" | "expert";
  certificationName?: string;
  certificationNumber?: string;
  issuedDate?: Date;
  expirationDate?: Date;
  issuer?: string;
  notes?: string;
}
```

**Response:**
```typescript
CrewSkill
```

#### `crewSkills.update`
Update a crew skill.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{
  id: number;
  skillName?: string;
  skillLevel?: "beginner" | "intermediate" | "expert";
  certificationName?: string;
  certificationNumber?: string;
  issuedDate?: Date;
  expirationDate?: Date;
  issuer?: string;
  notes?: string;
}
```

**Response:**
```typescript
CrewSkill
```

#### `crewSkills.delete`
Delete a crew skill.

**Type:** Mutation  
**Auth:** Protected

**Input:**
```typescript
{ id: number }
```

#### `crewSkills.getExpiredCertifications`
Get all expired certifications.

**Type:** Query  
**Auth:** Protected

**Response:**
```typescript
CrewSkill[]
```

#### `crewSkills.getExpiringCertifications`
Get certifications expiring soon.

**Type:** Query  
**Auth:** Protected

**Input:**
```typescript
{ daysUntilExpiry: number } // default: 30
```

**Response:**
```typescript
CrewSkill[]
```

---

### Financial Reporting Router (`financialReporting`)

#### `financialReporting.getTotalRevenue`
Get total revenue for a date range.

**Type:** Query  
**Auth:** Protected

**Input:**
```typescript
{
  startDate: Date;
  endDate: Date;
}
```

**Response:**
```typescript
{ totalRevenue: Decimal }
```

#### `financialReporting.getRevenueByMonth`
Get monthly revenue breakdown.

**Type:** Query  
**Auth:** Protected

**Input:**
```typescript
{
  startDate: Date;
  endDate: Date;
}
```

**Response:**
```typescript
Array<{
  month: string;
  revenue: Decimal;
}>
```

#### `financialReporting.getInvoiceStats`
Get invoice statistics.

**Type:** Query  
**Auth:** Protected

**Response:**
```typescript
{
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  totalAmount: Decimal;
  paidAmount: Decimal;
  unpaidAmount: Decimal;
}
```

#### `financialReporting.getProjectStats`
Get project statistics.

**Type:** Query  
**Auth:** Protected

**Response:**
```typescript
{
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalBudget: Decimal;
  spentAmount: Decimal;
}
```

---

## Error Handling

All API errors follow the tRPC error format:

```typescript
{
  code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR";
  message: string;
  data?: {
    code: string;
    httpStatus: number;
  };
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | User not authenticated |
| FORBIDDEN | 403 | User lacks permission |
| NOT_FOUND | 404 | Resource not found |
| BAD_REQUEST | 400 | Invalid input data |
| INTERNAL_SERVER_ERROR | 500 | Server error |

## Rate Limiting

Currently no rate limiting is implemented. Consider adding for production:
- 100 requests per minute per user
- 1000 requests per hour per user

## Pagination

Large datasets should implement pagination:

```typescript
// Example request
{
  limit: 20;
  offset: 0;
}

// Example response
{
  items: [];
  total: 100;
  limit: 20;
  offset: 0;
}
```

## Webhooks

### Stripe Webhook (`/api/stripe/webhook`)

Handles Stripe events:
- `checkout.session.completed` - Payment successful
- `payment_intent.succeeded` - Payment confirmed
- `payment_intent.payment_failed` - Payment failed
- `customer.created` - New customer
- `charge.refunded` - Refund processed

## Response Format

All successful responses follow this format:

```typescript
{
  result: {
    data: T; // Your response data
  };
}
```

## Examples

### Create Invoice
```typescript
const invoice = await trpc.invoices.create.useMutation().mutateAsync({
  projectId: 1,
  customerId: 1,
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  subtotal: new Decimal("5000.00"),
  tax: new Decimal("500.00"),
  total: new Decimal("5500.00"),
});
```

### Add Crew Skill
```typescript
const skill = await trpc.crewSkills.create.useMutation().mutateAsync({
  crewId: 1,
  skillName: "Metal Roofing",
  skillLevel: "expert",
  certificationName: "Metal Roofing Certified",
  expirationDate: new Date("2026-05-01"),
  issuer: "NRCA",
});
```

### Get Financial Dashboard
```typescript
const stats = await trpc.financialReporting.getInvoiceStats.useQuery();
const monthlyRevenue = await trpc.financialReporting.getRevenueByMonth.useQuery({
  startDate: new Date("2026-01-01"),
  endDate: new Date("2026-12-31"),
});
```

## Best Practices

1. **Always handle errors** - Wrap mutations in try-catch
2. **Use optimistic updates** - Update UI before server response
3. **Validate input** - Check data before sending
4. **Cache queries** - tRPC caches automatically
5. **Batch operations** - Use tRPC batch when possible
6. **Monitor performance** - Check network tab for slow requests
7. **Test edge cases** - Empty results, errors, timeouts
