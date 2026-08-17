# Subcontractor-Centric Operations Implementation

This document translates the supplied **Munro & Sons Roofing CRM: Subcontractor-Centric Operations Module** blueprint into the implementation contract for this repository. It preserves existing customer, project, estimate, invoice, payment, crew, calendar, photo, and material data while making partner-company work orders the primary operating flow.

## Operating Model

The primary hierarchy is **Company → Contact / Job Site → Work Order → Scope / Crew Assignments / Documents / Completion → Invoice → Payments → Account History**. A company is a long-lived account. A job site is reusable. A work order is the operational source of truth and is always owned by one company and one job site. Direct customers remain supported through the same company-account model using `accountType = direct_customer`.

| Domain | Primary records | Existing data preserved |
|---|---|---|
| Accounts | `companies`, `companyContacts`, `companyNotes` | `customers` remains available for legacy direct-customer projects and invoices |
| Operations | `jobSites`, `workOrders`, `workOrderScopes`, `workOrderAssignments`, `workOrderCompletions`, `changeOrders` | `projects`, `appointments`, `crews`, `crewMembers`, `materials`, `photos` remain available |
| Documents | `documents` | Existing `photos` stays intact; documents reference storage keys and URLs rather than database file bytes |
| Financials | `invoices.workOrderId`, `invoices.companyId`, existing `payments` | Existing invoices, Stripe records, and customer links remain valid |
| Accountability | `activityLog` extended through workflow actions | Existing activity rows stay intact |

## Required Account and Site Data

Each company includes legal and display names, account type, contact information, address, communication preference, payment terms, labour rate, served areas, requested-work notes, insurance/WSIB/safety requirements, special instructions, active status, and internal notes. Contacts are independent records, can be active or inactive, and can be selected on individual work orders.

Each job site belongs to one company and records its street address, property type, site contact, access and parking instructions, roof details, safety hazards, required equipment, notes, and historical work orders.

## Work Order Lifecycle

The work-order state machine supports the blueprint statuses below. Normal process flow follows the first row. Exception statuses can be entered from an active state and returned to normal processing when resolved.

| Category | Statuses |
|---|---|
| Normal workflow | `new` → `reviewed` → `accepted` → `scheduled` → `assigned` → `in_progress` → `waiting` → `completed` → `ready_for_invoice` → `invoiced` → `partially_paid` → `paid` → `closed` |
| Exception workflow | `cancelled`, `on_hold`, `disputed`, `callback_required` |

A work order stores its number, company, job site, optional company contact, received date, requested start date, deadline, job type, scope, labour requirements, crew requirements, materials summary, special instructions, purchase-order number, estimated value, agreed price, tax rate, status, and complete audit timestamps.

A completion record captures completion date, completed scope, quantity, labour hours, production quantity, materials used, deficiencies, sign-off name, crew notes, office notes, callback requirements, and relevant documentation. Completing a work order can move it directly to `ready_for_invoice` without re-entering scope or agreed-price data.

## Financial Rules

Existing invoices and payments remain the financial ledger. An invoice created from a work order receives the company and work-order references and cannot be duplicated for the same work order unless the prior invoice is cancelled. Invoice creation uses the completed scope and agreed price from the work order as defaults. Recording a payment updates invoice amount paid, invoice status, and related work-order status atomically.

The account financial view calculates total billed, total paid, outstanding balance, overdue balance, outstanding invoice count, last invoice date, last payment date, and average payment time. Aging buckets are current, 1–30, 31–60, 61–90, and 90+ days.

## Documents and Photos

Documents are persisted as metadata plus storage references. No file bytes are stored in database columns. A document can be owned by a company, job site, or work order and uses a type such as contract, purchase order, drawing, specification, safety document, insurance certificate, WSIB/WCB certificate, invoice, receipt, completion document, email/PDF, or other. Existing photo upload infrastructure continues to manage images and can associate project photos with related work-order context.

## Role Boundaries

The expanded user role set is `admin`, `office_manager`, `project_manager`, `crew_leader`, `worker`, `accounting`, and legacy `user`. Administrative and office roles can manage company data. Project-management roles can create and update work orders, scheduling, assignments, and completions. Accounting and administrative roles can issue invoices, record payments, and view account financials. Crew roles can view assigned work and submit operational completion details but cannot alter account balances.

## Acceptance Workflow

The implementation is accepted only after a user can create a partner company, add multiple contacts and job sites, create a work order against one site, add structured scope, assign and schedule crew work, upload and retrieve relevant documents, complete the work order, move it to ready for invoice, create exactly one invoice from it, record one or more payments, view account financial history and aging, search work-order history, and use the workflow on a mobile-width viewport. Every state-changing operation writes an audit activity.

## Compatibility and Migration Rules

Migrations only add tables, indexes, columns, enum values, or safe nullable references. Existing production rows are never removed or rewritten to simplify the new design. Legacy customer and project paths remain functional while new company and work-order paths become the primary operations model.
