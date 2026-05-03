# Rooftop Renovators CRM - System Architecture

## Overview

The Rooftop Renovators CRM is a full-stack web application built with React, Express, tRPC, and MySQL. It provides comprehensive tools for managing roofing business operations including customers, projects, estimates, invoices, payments, and crew management.

## Technology Stack

### Frontend
- **React 19** - UI framework
- **Tailwind CSS 4** - Styling
- **tRPC** - Type-safe API communication
- **Wouter** - Client-side routing
- **shadcn/ui** - Component library
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime
- **Express 4** - HTTP server
- **tRPC 11** - RPC framework
- **Drizzle ORM** - Database abstraction
- **MySQL/TiDB** - Database
- **Stripe** - Payment processing
- **Nodemailer** - Email delivery
- **pdf-lib** - PDF generation

### DevOps
- **Docker** - Containerization (optional)
- **GitHub** - Version control
- **Manus** - Hosting platform

## Project Structure

```
rooftop-renovators-crm/
├── client/                          # Frontend React application
│   ├── public/                      # Static assets (favicon, robots.txt)
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Customers.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Estimates.tsx
│   │   │   ├── Invoices.tsx
│   │   │   ├── InvoiceDetail.tsx
│   │   │   ├── InvoiceTemplates.tsx
│   │   │   ├── FinancialDashboard.tsx
│   │   │   ├── Calendar.tsx
│   │   │   ├── Crews.tsx
│   │   │   ├── Materials.tsx
│   │   │   └── RouteOptimization.tsx
│   │   ├── components/              # Reusable components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── PaymentButton.tsx
│   │   │   ├── Map.tsx
│   │   │   ├── AIChatBox.tsx
│   │   │   └── ui/                  # shadcn/ui components
│   │   ├── contexts/                # React contexts
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/
│   │   │   └── trpc.ts              # tRPC client setup
│   │   ├── App.tsx                  # Main app component with routes
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Global styles
│   └── index.html
├── server/                          # Backend Express application
│   ├── _core/                       # Framework infrastructure
│   │   ├── auth.ts                  # OAuth authentication
│   │   ├── context.ts               # tRPC context
│   │   ├── env.ts                   # Environment variables
│   │   ├── llm.ts                   # LLM integration
│   │   ├── imageGeneration.ts       # Image generation
│   │   ├── voiceTranscription.ts    # Voice to text
│   │   ├── notification.ts          # Owner notifications
│   │   └── map.ts                   # Google Maps integration
│   ├── db.ts                        # Database helpers
│   ├── routers.ts                   # tRPC procedure definitions
│   ├── stripe.ts                    # Stripe integration
│   ├── email.ts                     # Email templates and sending
│   ├── pdf.ts                       # PDF generation
│   ├── storage.ts                   # S3 file storage
│   ├── *.test.ts                    # Test files
│   └── index.ts                     # Express server entry point
├── drizzle/                         # Database schema and migrations
│   ├── schema.ts                    # Table definitions
│   ├── 0001_*.sql                   # Migration files
│   └── drizzle.config.ts            # Drizzle configuration
├── storage/                         # S3 storage helpers
├── shared/                          # Shared types and constants
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Core Modules

### 1. Authentication (`server/_core/auth.ts`)
- Manus OAuth integration
- Session management
- User context injection
- Protected procedure wrapper

### 2. Database (`server/db.ts`)
- Drizzle ORM helpers
- CRUD operations for all entities
- Query builders
- Relationship management

### 3. tRPC Router (`server/routers.ts`)
Organized into feature-based routers:
- `auth` - Authentication procedures
- `customers` - Customer CRUD
- `projects` - Project management
- `estimates` - Estimate generation
- `invoices` - Invoice management
- `invoiceTemplates` - Template customization
- `payments` - Stripe integration
- `financialReporting` - Analytics
- `crews` - Crew management
- `crewSkills` - Skills and certifications
- `appointments` - Calendar scheduling
- `photos` - Photo management
- `materials` - Material inventory

### 4. Payment Processing (`server/stripe.ts`)
- Checkout session creation
- Payment intent handling
- Refund processing
- Customer management

### 5. Email System (`server/email.ts`)
- HTML email templates
- Invoice email delivery
- Nodemailer configuration
- Attachment handling

### 6. PDF Generation (`server/pdf.ts`)
- Invoice PDF creation
- pdf-lib integration
- Branding customization

### 7. File Storage (`server/storage.ts` & `storage/`)
- S3 integration
- File upload/download
- Presigned URLs
- Public file access

## Database Schema

### Core Tables

#### Users
- User accounts and authentication
- Role-based access control (user, admin)

#### Customers
- Customer/lead information
- Contact details and location
- Status tracking (lead, qualified, won, lost)

#### Projects
- Project details and timeline
- Customer association
- Crew assignment
- Status tracking

#### Estimates
- Estimate generation from projects
- Line items with materials and labor
- Total cost calculation
- Status tracking

#### Invoices
- Invoice generation from estimates
- Payment tracking
- Status management (draft, sent, paid, overdue)
- Auto-numbering (INV-YYYYMM-0001)

#### Invoice Templates
- Customizable invoice layouts
- Branding (colors, company info, logo)
- Template selection per invoice

#### Payments
- Stripe payment records
- Payment status tracking
- Refund management
- Receipt storage

#### Crews
- Crew information and contacts
- Crew lead assignment
- Status (active/inactive)

#### Crew Skills
- Skill tracking per crew
- Certification management
- Expiration date tracking
- Skill levels (beginner, intermediate, expert)

#### Appointments
- Calendar events
- Crew scheduling
- Project association

#### Photos
- Photo uploads
- Damage documentation
- Project association

#### Materials
- Material inventory
- Pricing
- Supplier information

#### Damages
- Damage assessment
- Category tracking
- Project association

### Relationships

```
users (1) ──→ (many) customers
users (1) ──→ (many) projects
users (1) ──→ (many) invoices
users (1) ──→ (many) payments
users (1) ──→ (many) crews
users (1) ──→ (many) crewSkills

customers (1) ──→ (many) projects
customers (1) ──→ (many) damages

projects (1) ──→ (many) estimates
projects (1) ──→ (many) invoices
projects (1) ──→ (many) appointments
projects (1) ──→ (many) photos
projects (1) ──→ (many) damages

estimates (1) ──→ (many) invoices
estimates (1) ──→ (many) estimateLineItems

invoices (1) ──→ (many) payments

crews (1) ──→ (many) crewSkills
crews (1) ──→ (many) projects

damages (1) ──→ (many) damagePhotos
damages (1) ──→ (many) damageMaterials
```

## API Communication Flow

### Frontend to Backend

```
React Component
    ↓
tRPC Hook (useQuery/useMutation)
    ↓
tRPC Client (client/src/lib/trpc.ts)
    ↓
HTTP Request to /api/trpc
    ↓
Express Server
    ↓
tRPC Router (server/routers.ts)
    ↓
Database Helpers (server/db.ts)
    ↓
Drizzle ORM
    ↓
MySQL Database
```

### Data Flow Example: Creating an Invoice

1. User fills form in `InvoiceDetail.tsx`
2. Calls `trpc.invoices.create.useMutation()`
3. tRPC sends POST to `/api/trpc?batch=1&input=...`
4. Express routes to tRPC handler
5. Handler validates input with Zod
6. Calls `db.createInvoice(data)`
7. Drizzle generates SQL and executes
8. Returns created invoice object
9. Frontend receives typed response
10. Component updates with new data

## Authentication Flow

```
User clicks "Login"
    ↓
Redirected to Manus OAuth portal
    ↓
User authenticates
    ↓
OAuth callback to /api/oauth/callback
    ↓
Exchange code for session
    ↓
Set session cookie
    ↓
Redirect to dashboard
    ↓
Protected routes check session
    ↓
User context injected into tRPC procedures
```

## Environment Variables

### Required for Development
```
DATABASE_URL=mysql://user:pass@host:port/db
JWT_SECRET=your-secret-key
VITE_APP_ID=manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name
```

### Stripe Integration
```
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Manus APIs
```
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=frontend-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

## Deployment Architecture

```
GitHub Repository
    ↓
Manus Platform
    ↓
├─ Frontend Build (Vite)
│  └─ Static assets → CDN
├─ Backend Build (Node.js)
│  └─ Express server → Cloud Run
└─ Database
   └─ TiDB Cloud → MySQL compatible
```

## Performance Considerations

1. **Database Queries:** Use Drizzle ORM for optimized queries
2. **Caching:** tRPC client caches queries automatically
3. **File Storage:** Large files stored in S3, not database
4. **PDF Generation:** Async processing to avoid blocking
5. **Email Delivery:** Queued for async processing
6. **Pagination:** Implement for large datasets

## Security Measures

1. **Authentication:** Manus OAuth with session cookies
2. **Authorization:** Protected procedures check user context
3. **Input Validation:** Zod schema validation on all inputs
4. **SQL Injection:** Drizzle ORM prevents SQL injection
5. **CORS:** Configured for frontend domain
6. **Secrets:** Environment variables for sensitive data
7. **File Upload:** Validated file types and sizes
8. **Stripe:** PCI compliance via Stripe (no card storage)

## Testing Strategy

### Unit Tests (`*.test.ts`)
- Database helper functions
- Business logic
- Validation rules

### Integration Tests
- tRPC procedures
- Database transactions
- Error handling

### Test Files
- `server/auth.logout.test.ts` - Authentication
- `server/features.test.ts` - CRUD operations
- `server/invoices.test.ts` - Invoice generation
- `server/calendar.test.ts` - Appointments
- `server/photos.test.ts` - Photo management
- `server/pdf-email.test.ts` - PDF and email

## Monitoring & Logging

### Log Files (`.manus-logs/`)
- `devserver.log` - Server startup and errors
- `browserConsole.log` - Frontend console output
- `networkRequests.log` - HTTP request tracking
- `sessionReplay.log` - User interaction events

### Error Handling
- Try-catch blocks in procedures
- Zod validation errors
- Database constraint violations
- External API failures (Stripe, email, etc.)

## Future Architecture Improvements

1. **Microservices:** Separate services for payments, email, PDFs
2. **Message Queue:** Use Redis/RabbitMQ for async jobs
3. **Caching Layer:** Redis for frequently accessed data
4. **GraphQL:** Alternative to tRPC for complex queries
5. **WebSockets:** Real-time updates for collaborative features
6. **Event Sourcing:** Track all business events
7. **CQRS:** Separate read/write models for scalability
