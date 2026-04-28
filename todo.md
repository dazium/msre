# Rooftop Renovators CRM - Project TODO

## Database & Schema
- [x] Generate Drizzle migrations from schema.ts
- [x] Apply migrations to database
- [x] Verify all tables created successfully

## Core UI Framework
- [x] Design and implement blueprint aesthetic with CSS (deep royal blue, grid pattern, white CAD-style lines)
- [x] Set up global theming and color variables
- [x] Create DashboardLayout component with sidebar navigation
- [ ] Implement responsive mobile navigation
- [x] Add Google Fonts for bold sans-serif typography
- [x] Create reusable card and section components with blueprint styling
- [x] Set up loading states and error boundaries

## Lead & Customer Management (PRIORITY)
- [x] Create customers table queries in server/db.ts
- [x] Build customers list page with search and filter
- [x] Add customer creation form with validation
- [x] Build customer status tracking (lead → won/lost)
- [x] Add customer update functionality
- [x] Comprehensive tests for all customer operations
- [ ] Implement customer detail view with edit capability
- [ ] Create customer contact history/notes section

## Project Tracking
- [x] Create projects table queries in server/db.ts
- [x] Add project creation form with customer linking
- [x] Build project status update workflow
- [x] Add project update functionality
- [x] Comprehensive tests for all project operations
- [ ] Build projects dashboard with kanban-style status board
- [ ] Implement project detail view with timeline
- [ ] Create project timeline visualization

## Estimates & Pricing (IN PROGRESS)
- [x] Create estimates table queries in server/db.ts
- [ ] Build estimate creation form with line items
- [ ] Implement estimate line item management (add/edit/delete)
- [ ] Create estimate total calculation logic
- [ ] Build estimate preview/PDF view
- [ ] Add estimate status tracking (draft → sent → accepted)
- [ ] Implement estimate number auto-generation
- [ ] Create estimate history for each project
- [ ] Auto-populate estimates from damages
- [ ] Write tests for estimates feature

## Photo Upload & Documentation (PRIORITY)
- [x] Set up S3 file storage integration
- [x] Create photo upload component with drag-and-drop
- [x] Build photo gallery for projects and customers
- [x] Add photo tagging and caption functionality
- [x] Implement photo organization by project
- [x] Create photo deletion and management features
- [x] Link photos to damage records
- [x] Create tests for photo upload feature (12 tests passing)
- [ ] Add before/after photo comparison view

## Damages Tracking (PRIORITY)
- [x] Create damages table in schema (link to projects, descriptions, photos)
- [x] Build damages form with customer/house selection
- [x] Add damage description input with predefined categories
- [x] Support all damage categories and severity levels
- [x] Comprehensive tests for all damage operations
- [ ] Implement photo attachment to damage items
- [ ] Create damage list view with photos

## Calendar & Scheduling (COMPLETE)
- [x] Create appointments table queries in server/db.ts
- [x] Build calendar view component (month/week/day)
- [x] Implement appointment creation form
- [x] Add appointment types (estimate, inspection, job start, etc.)
- [x] Implement appointment status tracking
- [x] Write tests for calendar feature (14 tests passing)
- [ ] Create appointment notifications/reminders
- [ ] Build appointment detail view with editing
- [ ] Add calendar filtering by type and status

## Google Maps Integration (IN PROGRESS)
- [x] Integrate Google Maps component for job location visualization
- [x] Add markers for all scheduled appointments
- [x] Implement route planning between multiple job locations
- [x] Add location search and geocoding
- [x] Create directions display with estimated travel time
- [ ] Add map filtering by appointment type and status

## Dashboard
- [ ] Create dashboard overview page
- [ ] Display active projects widget
- [ ] Show recent leads widget
- [ ] Add upcoming appointments widget
- [ ] Create quick stats (total customers, active projects, revenue)
- [ ] Build activity feed showing recent changes
- [ ] Add key metrics and KPIs display

## Google Maps Integration
- [ ] Set up Google Maps component from template
- [ ] Implement job location visualization on map
- [ ] Add route planning between multiple jobs
- [ ] Create location search and geocoding
- [ ] Build address validation using Maps API
- [ ] Add map markers for customers and projects
- [ ] Implement map filtering by project status

## LLM Integration
- [ ] Set up LLM helper for project summaries
- [ ] Create estimate description generation
- [ ] Build project notes auto-generation
- [ ] Implement customer profile summary generation
- [ ] Add AI-powered project recommendations
- [ ] Create estimate optimization suggestions

## Search & Filtering
- [ ] Implement global search across leads and projects
- [ ] Add advanced filter panel for customers
- [ ] Build project filter by status, date, value
- [ ] Create estimate filter by status and date
- [ ] Add saved filter presets
- [ ] Implement search result highlighting

## Mobile Responsiveness
- [ ] Test all pages on mobile devices
- [ ] Optimize touch interactions for mobile
- [ ] Implement mobile-friendly forms
- [ ] Create mobile-optimized photo upload
- [ ] Build mobile calendar view
- [ ] Test map functionality on mobile
- [ ] Ensure fast loading on mobile networks

## Testing & Quality
- [x] Write vitest tests for database queries
- [x] Create tests for tRPC procedures
- [x] Test customer management workflows
- [x] Test project tracking workflows
- [x] Test damage assessment workflows
- [x] Integration tests for full workflows
- [x] Concurrent operation and data consistency tests
- [ ] Build component tests for key UI elements
- [ ] Test estimate calculations

## UI Polish & Branding
- [ ] Apply Rooftop Renovators branding
- [ ] Add company logo and favicon
- [ ] Refine blueprint aesthetic throughout
- [ ] Ensure consistent spacing and alignment
- [ ] Add micro-interactions and animations
- [ ] Optimize colors for accessibility
- [ ] Test dark/light theme consistency
- [ ] Add empty states and loading skeletons

## Performance & Optimization
- [ ] Optimize database queries with indexes
- [ ] Implement pagination for large lists
- [ ] Add lazy loading for images
- [ ] Optimize bundle size
- [ ] Test performance on slow networks
- [ ] Implement caching strategies

## Deployment & Final
- [ ] Create initial checkpoint
- [ ] Verify all features work end-to-end
- [ ] Test user authentication flow
- [ ] Validate data persistence
- [ ] Create deployment documentation
- [ ] Final QA and bug fixes
- [ ] Deliver to user

## Materials Tracking (NEW PRIORITY)
- [x] Add materials table to schema (drip edge, vents, ice and water, synthetic underlay, etc.)
- [x] Create materials checklist component with quantity inputs
- [x] Integrate materials into Damages form
- [ ] Display materials with quantities in Estimates
- [ ] Auto-calculate material costs based on quantities
- [ ] Write tests for materials feature

## Final Bug Fixes & Enhancements
- [x] Fix Photos page TypeScript errors
- [x] Fix Estimates schema (totalAmount field)
- [x] Fix server routers compilation errors
- [x] Add customer location search with geocoding
- [x] Implement route optimization for multi-stop planning
- [x] Ensure all tests pass

---

# PHASE 1: QUICK WINS (High Impact, Low Effort)

## Customer Management - Phase 1
- [ ] Customer portal - View projects, estimates, photos
- [ ] Customer communication hub - SMS, email, in-app notifications
- [ ] Customer history & notes - Interaction log and service history
- [ ] Customer feedback system - Post-project surveys and ratings

## Sales & Quoting - Phase 1
- [ ] Multi-estimate workflow - Create multiple options (basic, standard, premium)
- [ ] Estimate templates - Save and reuse common configurations
- [ ] Estimate versioning - Track revisions and changes
- [ ] Estimate expiration - Set dates with auto-reminders
- [ ] Mobile estimate creation - Create estimates on-site with photos

## Project Management - Phase 1
- [ ] Project phases - Break into inspection, estimation, scheduling, installation, cleanup
- [ ] Project milestones - Key dates and deliverables
- [ ] Project status dashboard - At-a-glance view of all projects
- [ ] Project attachments - Store blueprints, permits, contracts
- [ ] Project completion checklist - Ensure all steps completed

## Scheduling & Crew - Phase 1
- [ ] Crew availability calendar - Visual crew availability
- [ ] Crew assignments - Assign crew to projects with roles
- [ ] Job scheduling - Drag-and-drop scheduling interface
- [ ] Schedule conflict alerts - Warn on double-booking

## Materials - Phase 1
- [ ] Material allocation - Assign materials to projects
- [ ] Low stock alerts - Notifications when below reorder point
- [ ] Material waste tracking - Record actual vs. estimated waste

---

# PHASE 2: CORE OPERATIONS

## Invoicing & Payments - Phase 2
- [x] Invoice generation - Auto-generate from estimates
- [x] Invoice database schema and tRPC procedures
- [x] Invoice UI components (create, list, filter)
- [x] Invoice number auto-generation with format
- [x] Invoice status tracking (draft, sent, viewed, paid, overdue, cancelled)
- [x] Comprehensive invoice tests (17 tests passing)
- [ ] Invoice templates - Customizable layouts with branding
- [ ] Partial invoicing - Invoice for completed phases
- [ ] Payment processing - Stripe integration for credit card payments
- [ ] Payment plans - Allow installment payments
- [ ] Automatic payment reminders - Overdue invoice notifications
- [ ] Late payment fees - Auto-apply after X days
- [ ] Refunds & credits - Process refunds and apply credits

## Financial Reporting - Phase 2
- [ ] Revenue dashboard - Total revenue, trends, by project type
- [ ] Profit & Loss report - Revenue minus costs
- [ ] Cash flow forecast - Project future cash based on invoices
- [ ] Budget vs. actual - Compare budgeted to actual costs
- [ ] Project profitability report - Profit margin by project/crew
- [ ] Customer lifetime value - Total revenue per customer
- [ ] Sales pipeline report - Value of open estimates
- [ ] Accounts receivable aging - Money owed and when due

## Inspections & Damage Assessment - Phase 2
- [ ] Inspection checklist - Standardized forms by roof type
- [ ] Damage classification - Categorize by type (hail, wind, age, leak)
- [ ] Damage severity levels - Cosmetic, functional, structural
- [ ] Inspection photos - Organize by roof section with annotations
- [ ] Inspection reports - Auto-generate professional reports
- [ ] Insurance claim support - Generate reports for claims
- [ ] Inspection history - Track all inspections over time

## Compliance & Documentation - Phase 2
- [ ] Permit tracking - Track required permits and status
- [ ] License & certification management - Track crew credentials
- [ ] Insurance documentation - Store certificates, track expiration
- [ ] Contract management - Store and manage customer contracts
- [ ] Compliance checklists - Ensure requirements are met
- [ ] Document storage - Centralized storage with version control
- [ ] Audit trail - Complete record of system changes

## Warranty Management - Phase 2
- [ ] Warranty tracking - Record warranty terms per project
- [ ] Warranty claims - Process warranty claims with documentation
- [ ] Warranty reminders - Auto-remind customers about warranties

---

# PHASE 3: INTEGRATIONS & ADVANCED FEATURES

## Payment & Accounting Integrations - Phase 3
- [ ] Stripe integration - Complete payment processing
- [ ] QuickBooks Online sync - Sync invoices and financial data
- [ ] Xero integration - Alternative accounting software
- [ ] FreshBooks integration - Project accounting sync

## Communication & Notifications - Phase 3
- [ ] Twilio SMS integration - SMS notifications and marketing
- [ ] Email service integration - SendGrid/Mailgun for transactional emails
- [ ] Slack integration - Notifications to team Slack channels
- [ ] Push notifications - Real-time alerts to mobile app

## Scheduling & Mapping - Phase 3
- [ ] Google Calendar sync - Complete integration with crew calendars
- [ ] Google Maps integration - Route optimization and geolocation
- [ ] Travel time calculation - Account for travel between jobs
- [ ] Weather API integration - Weather forecasts for scheduling

## Marketing & Lead Generation - Phase 3
- [ ] Lead capture forms - Website forms that auto-populate CRM
- [ ] Lead scoring - Automatic scoring based on engagement
- [ ] Email marketing - Campaign management and automation
- [ ] SMS marketing - Text message campaigns
- [ ] Review management - Monitor Google, Yelp, Facebook reviews
- [ ] Referral program - Track referrals and rewards
- [ ] Social media integration - Track leads from Facebook, Instagram

## Advanced Features - Phase 3
- [ ] Expense tracking - Record and categorize business expenses
- [ ] Crew performance metrics - Track productivity and quality
- [ ] Crew payroll integration - Track hours for payroll
- [ ] Crew geolocation tracking - Real-time location of crews
- [ ] Crew certification management - Track licenses and training
- [ ] Supplier management - Store supplier info and pricing
- [ ] Purchase orders - Create and track POs
- [ ] Vendor pricing comparison - Compare prices across suppliers
- [ ] Material barcoding - Barcode scanning for inventory
- [ ] Bulk purchasing discounts - Track and apply volume discounts
- [ ] Conditional pricing - Different pricing by complexity/season
- [ ] Discount management - Apply discounts with approval workflows
- [ ] Tax configuration - Support multiple tax rates by region
- [ ] Multi-currency support - USD, CAD, and other currencies
- [ ] Knowledge base - Self-service FAQ and troubleshooting
- [ ] Live chat support - Real-time customer support
- [ ] Ticket system - Track customer issues and requests
- [ ] SLA tracking - Response and resolution time tracking
- [ ] Service requests - Schedule maintenance and repairs
- [ ] Offline mode - Mobile app works offline with sync


## Phase 1.5: Invoice PDF Export & Email (COMPLETE)
- [x] Add PDF export tRPC procedure
- [x] Create PDF generation helper using pdf-lib
- [x] Add email delivery tRPC procedure
- [x] Create email helper with HTML template support
- [x] Build invoice detail page component
- [x] Add "Export to PDF" button with download
- [x] Add "Send Email" button with recipient input
- [x] Write tests for PDF generation (5 tests)
- [x] Write tests for email delivery (4 tests)
- [x] Test end-to-end PDF and email workflows (1 test)
