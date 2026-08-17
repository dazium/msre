Munro & Sons Roofing CRM

Subcontractor-Centric Operations Module

Scope of Work / System Blueprint

1. Purpose

The Roofing CRM shall be redesigned and expanded around the actual operating model of Munro & Sons, where the majority of work is performed as subcontract work for larger roofing, construction, restoration, and related companies.

The system shall treat subcontracting as the primary business workflow rather than as a secondary feature attached to a traditional homeowner/customer CRM.

The objective is to provide one centralized system for managing subcontractor accounts, work orders, job sites, crews, documentation, invoicing, payments, performance history, and company relationships.

This specification is intended to serve as the implementation blueprint for developers, AI coding agents, and future development work.

---

2. Core Business Model

The CRM shall recognize two primary account types:

1. Subcontractor / Partner Company
2. Direct Customer

The Subcontractor / Partner Company workflow shall be the primary workflow.

A subcontracting company may send Munro & Sons multiple work orders over many years. Therefore, the company record must function as a long-term account containing the complete history of its relationship with Munro & Sons.

The hierarchy shall generally be:

Company
→ Work Orders
→ Job Sites
→ Crew Assignments
→ Work Completed
→ Invoice
→ Payment
→ Account History

A single company may have many contacts, many job sites, and hundreds of historical work orders.

---

3. Company / Account Management

Create a dedicated Companies & Accounts section.

Each company record shall contain:

Company Information

- Company name
- Account type
- Legal/business name
- Address
- Phone
- Email
- Website
- Primary contact
- Secondary contacts
- Notes
- Active/inactive status

Subcontractor Information

- Contractor/company classification
- Areas served
- Typical work requested
- Preferred communication method
- Standard payment terms
- Standard labour rates
- Contract information
- Insurance requirements
- WSIB/WCB requirements
- Safety requirements
- Required documentation
- Special instructions

Financial Information

- Total billed
- Total paid
- Current outstanding balance
- Number of outstanding invoices
- Average payment time
- Last payment
- Last invoice
- Revenue generated over selected periods

Account History

Display a chronological history of:

- Work orders
- Completed jobs
- Invoices
- Payments
- Documents
- Notes
- Communications
- Callbacks
- Disputes
- Change orders

---

4. Contacts

A company may have multiple contacts.

Contacts shall support roles such as:

- Owner
- Project Manager
- Site Supervisor
- Dispatcher
- Estimator
- Accounts Payable
- Accounts Receivable
- Safety Coordinator
- Other

Each contact should have:

- Name
- Position
- Phone
- Mobile
- Email
- Preferred contact method
- Notes
- Active/inactive status

The system shall allow a specific contact to be associated with individual work orders.

---

5. Work Orders

Work Orders shall become the central operational object.

A subcontractor may send a work order by phone, email, text, PDF, portal, or other means.

The CRM shall allow staff to create a Work Order quickly.

Required fields:

- Work Order number
- Company
- Contact
- Job/site address
- Date received
- Requested start date
- Deadline
- Job type
- Scope of work
- Materials
- Labour requirements
- Crew requirements
- Special instructions
- Attachments
- Photos
- Estimated value
- Agreed price/rate
- Status

Work Order statuses should include:

New
→ Reviewed
→ Accepted
→ Scheduled
→ Assigned
→ In Progress
→ Waiting
→ Completed
→ Ready for Invoice
→ Invoiced
→ Partially Paid
→ Paid
→ Closed

Additional exception statuses may include:

Cancelled
On Hold
Disputed
Callback Required

---

6. Job Sites

A company may send Munro & Sons to many different properties.

Job sites shall therefore be independent records associated with both the company and individual work orders.

Job site information should include:

- Address
- Property type
- Site contact
- Access instructions
- Parking information
- Roof information
- Safety hazards
- Required equipment
- Photos
- Notes
- Historical work
- Previous crews
- Previous issues

The CRM should recognize when a company sends Munro & Sons back to a previously serviced location.

---

7. Job Scope

Every work order shall contain a clearly defined scope.

The scope should support structured roofing work categories such as:

- Tear-off
- Shingle installation
- Flat roofing
- Repairs
- Flashing
- Ventilation
- Ice/water protection
- Underlayment
- Metal work
- Skylights
- Soffit/fascia
- Eavestrough
- Emergency repairs
- Snow-related work
- Other

The system should also permit custom scope descriptions.

The scope shall be visible to the crew and office staff.

---

8. Crew Management

Create a crew/worker assignment system.

A work order shall allow one or more workers or crews to be assigned.

Track:

- Crew leader
- Workers
- Start date
- Completion date
- Hours
- Labour quantity
- Production quantity
- Notes
- Photos
- Issues encountered

The system should eventually support productivity reporting by crew and worker where appropriate.

---

9. Job Completion

A completed work order should have a formal completion process.

The completion record should allow:

- Completion date
- Completed scope
- Quantity completed
- Labour information
- Materials used
- Completion photos
- Deficiencies
- Customer/subcontractor sign-off
- Crew notes
- Office notes
- Callback requirements

Once completed, the system should be able to move the work order to:

Ready for Invoice

without requiring duplicate data entry.

---

10. Documentation

Every company and work order should support document attachments.

Examples:

- Contracts
- Work orders
- Purchase orders
- Drawings
- Blueprints
- Specifications
- Safety documents
- Insurance certificates
- WSIB/WCB documents
- Invoices
- Receipts
- Photos
- Completion documents
- Emails/PDFs

Documents should be associated with the correct company, work order, or job site.

---

11. Blueprint / Drawing Support

Because subcontract work may be based on plans, drawings, or specifications, the CRM should provide a place for project documentation.

A work order/project should be able to contain:

- Blueprint files
- PDF plans
- Scope documents
- Specifications
- Revision numbers
- Notes regarding revisions

Future functionality may allow AI-assisted extraction of useful information from uploaded plans, but this is not required for the initial implementation.

---

12. Invoicing

The CRM should support a transition from completed work to invoicing.

When a job reaches "Ready for Invoice," the system should display:

- Company
- Work order
- Job address
- Completed scope
- Agreed price
- Labour
- Additional charges
- Change orders
- Applicable taxes
- Invoice number
- Invoice date
- Payment terms

The system should prevent accidental duplicate invoicing.

---

13. Payments / Accounts Receivable

Each company should have an account-level financial view.

Track:

- Invoice amount
- Invoice date
- Due date
- Payment date
- Amount paid
- Remaining balance
- Payment status
- Payment method
- Notes

Payment statuses:

Unpaid
Partially Paid
Paid
Overdue
Disputed
Written Off

The system should provide aging information such as:

Current
1–30 days
31–60 days
61–90 days
90+ days

---

14. Subcontractor Dashboard

The main CRM dashboard should prioritize subcontracting activity.

Recommended dashboard metrics:

Operations

- Active work orders
- New work orders
- Scheduled jobs
- Jobs in progress
- Jobs waiting
- Completed jobs
- Jobs requiring callbacks

Financial

- Ready to invoice
- Invoiced this month
- Paid this month
- Outstanding invoices
- Overdue invoices
- Total outstanding
- Revenue by company

Workload

- Jobs by date
- Jobs by crew
- Jobs by company
- Upcoming deadlines
- Overdue jobs

---

15. Company Performance Dashboard

Each subcontractor/company account should provide historical business intelligence.

Track:

- Number of jobs
- Total revenue
- Average job value
- Average payment time
- Outstanding balance
- Jobs per month
- Callback rate
- Disputed jobs
- Cancellation rate
- Most common job types
- Last activity

This information should help Munro & Sons determine which accounts are most valuable and which accounts create operational or financial problems.

---

16. Search and Filtering

The CRM must provide fast global searching.

Users should be able to search by:

- Company
- Contact
- Work order number
- Job address
- Invoice number
- PO number
- Job type
- Crew
- Status
- Date
- Payment status

Filtering should work independently and in combination.

Example:

"Show all unpaid subcontract jobs for ABC Roofing completed in the last 90 days."

---

17. Notifications / Alerts

The system should eventually support alerts for:

- New work order
- Upcoming job
- Missed deadline
- Job completion
- Ready for invoice
- Overdue invoice
- Required document expiration
- Callback
- Disputed invoice
- Payment received

Notifications should be configurable rather than hard-coded.

---

18. Reporting

Reports should be available for:

- Revenue by subcontractor
- Revenue by month
- Jobs completed
- Jobs by type
- Jobs by crew
- Outstanding accounts receivable
- Invoice aging
- Average payment time
- Callback frequency
- Company profitability
- Work volume
- Production history

Reports should support date ranges.

---

19. CRM Navigation

Recommended primary navigation:

Dashboard

Companies & Accounts

Work Orders

Jobs / Job Sites

Crews

Calendar / Schedule

Invoices

Payments

Documents

Reports

Settings

The navigation should remain simple and usable from both desktop and mobile devices.

---

20. Direct Customer Support

Direct residential/commercial customers should remain supported.

However, they should not determine the overall architecture.

The account system should allow:

Account Type

- Subcontractor / Partner
- Direct Customer

Both account types can use common components where practical.

Subcontractor-specific features should only appear when relevant.

---

21. Data Relationships

The underlying data model should conceptually follow:

Company
├── Contacts
├── Job Sites
├── Work Orders
│   ├── Scope
│   ├── Crew Assignments
│   ├── Documents
│   ├── Photos
│   ├── Completion
│   ├── Change Orders
│   └── Invoice
├── Invoices
├── Payments
├── Documents
└── Account History

A work order must always be traceable back to its originating company.

A job site must be reusable across multiple work orders.

Financial records must remain connected to the original work order.

---

22. User Experience Requirements

The system should prioritize speed.

A user should be able to create a new subcontract work order without navigating through multiple unnecessary screens.

The workflow should be optimized for someone working from a truck, job site, office, or phone.

Important actions should be obvious:

New Work Order

Schedule

Assign Crew

Start Job

Complete Job

Create Invoice

Record Payment

The system should minimize duplicate data entry.

---

23. Mobile Requirements

The CRM must remain usable on mobile devices.

Mobile users should be able to:

- View today's jobs
- Open job addresses
- Call contacts
- View scope
- View plans/documents
- Upload photos
- Add notes
- Update job status
- Record completion
- View assigned crew

The interface should not require a desktop for normal field operations.

---

24. Future AI Integration

The architecture should leave room for future AI functionality.

Potential future features include:

- Extract work-order information from PDFs
- Read blueprints/specifications
- Convert emails into draft work orders
- Identify missing information
- Summarize job scopes
- Generate invoice drafts
- Identify overdue accounts
- Analyze company profitability
- Detect recurring callbacks
- Generate management reports
- Search the entire company history using natural language

Example:

"Show me all the jobs we did for ABC Roofing in the last two years where we had a callback."

The database structure should support this type of querying in the future.

---

25. Security and Permissions

The system should support role-based access.

Potential roles:

Administrator
Office Manager
Project Manager
Crew Leader
Worker
Accounting

Financial information should be restrictable to authorized users.

Users should only be able to perform actions appropriate to their role.

---

26. Audit Trail

Important changes should be logged.

The system should record:

- Who created a work order
- Who modified it
- What changed
- When it changed
- Who changed status
- Who created an invoice
- Who recorded payment
- Who marked a job complete

This becomes particularly important when multiple people use the system.

---

27. Implementation Priority

Development should occur in phases.

Phase 1 — Foundation

- Companies
- Contacts
- Account types
- Work orders
- Job sites
- Basic statuses
- Search
- Dashboard

Phase 2 — Operations

- Scheduling
- Crews
- Job completion
- Photos
- Documents
- Work-order history

Phase 3 — Financial

- Invoices
- Payments
- Accounts receivable
- Aging
- Financial dashboards

Phase 4 — Reporting

- Company performance
- Revenue reporting
- Crew reporting
- Production reporting
- Callback reporting

Phase 5 — Advanced Features

- Blueprint/document intelligence
- AI work-order extraction
- AI reporting
- Natural-language search
- Automated notifications
- Advanced analytics

---

28. Acceptance Criteria

The implementation shall be considered successful when a user can:

1. Create a subcontractor/company account.
2. Add multiple contacts to that company.
3. Create multiple job sites for that company.
4. Create a work order originating from that company.
5. Attach the work order to a job site.
6. Define the scope.
7. Attach documents/photos.
8. Assign a crew.
9. Schedule the job.
10. Track the job through completion.
11. Record completion information.
12. Move the completed work order to Ready for Invoice.
13. Create an invoice from the work order without re-entering core information.
14. Record payment against the invoice.
15. See the complete financial history of the company.
16. Search historical jobs.
17. View active and completed work.
18. See outstanding accounts receivable.
19. View company performance.
20. Access the system from a mobile device.

---

29. Design Principle

The CRM should reflect the real business rather than force the business into a generic CRM template.

The primary question behind every feature should be:

"Does this make it easier for Munro & Sons to receive, organize, complete, document, bill, and collect payment for subcontract work?"

If a feature does not support that objective, it should not take priority over the core subcontract workflow.

---

30. Development Rule

This document is the functional blueprint.

Future developers or AI coding agents should:

- Review the existing application before modifying it.
- Preserve existing working functionality unless explicitly replacing it.
- Compare the current database/schema against this specification.
- Implement the smallest logical change necessary.
- Avoid creating duplicate data structures.
- Maintain consistent naming conventions.
- Preserve existing visual identity where practical.
- Test existing functionality after significant changes.
- Document deviations from this specification.
- Never remove existing production data merely to simplify implementation.

The CRM should evolve incrementally from the current application into the subcontractor-centric operations platform described above.