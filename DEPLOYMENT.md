# Deployment & Configuration Guide

## Overview

The Rooftop Renovators CRM is deployed on the Manus platform with automatic CI/CD, database hosting, and custom domain support.

## Pre-Deployment Checklist

- [ ] All tests passing (`pnpm test`)
- [ ] No TypeScript errors (`pnpm tsc`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Stripe sandbox claimed and configured
- [ ] Email configuration verified
- [ ] All features tested in development

## Environment Setup

### Development Environment

1. **Clone Repository**
```bash
git clone <repository-url>
cd rooftop-renovators-crm
```

2. **Install Dependencies**
```bash
pnpm install
```

3. **Configure Environment Variables**
Create `.env.local` (not committed to git):
```env
# Database
DATABASE_URL=mysql://user:pass@host:port/db

# Authentication
JWT_SECRET=your-secret-key
VITE_APP_ID=manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name

# Stripe
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=frontend-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

4. **Run Development Server**
```bash
pnpm dev
```

Server runs on `http://localhost:3000`

### Production Environment

Environment variables are automatically configured by the Manus platform. No manual setup required.

## Database Configuration

### TiDB Cloud Setup

1. **Create TiDB Cluster**
   - Region: US East
   - Tier: Starter (or higher)
   - Enable public endpoint

2. **Get Connection String**
   - Format: `mysql://user:pass@host:port/database?ssl={"rejectUnauthorized":true}`
   - Set as `DATABASE_URL`

3. **Apply Migrations**
```bash
# Generate migration
pnpm drizzle-kit generate

# Review generated SQL
cat drizzle/XXXX_*.sql

# Apply to database
pnpm drizzle-kit migrate
```

### Database Backup

TiDB Cloud provides automatic backups. To restore:
1. Access TiDB Cloud console
2. Navigate to Backups
3. Select backup and restore

## Stripe Configuration

### Sandbox Setup

1. **Claim Sandbox**
   - Visit: https://dashboard.stripe.com/claim_sandbox/[sandbox-id]
   - Complete within 90 days of provisioning

2. **Get API Keys**
   - Publishable Key: `pk_test_...`
   - Secret Key: `sk_test_...`
   - Webhook Secret: `whsec_...`

3. **Configure Webhook**
   - Endpoint: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`

### Testing Payments

Use test card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

### Live Mode Setup

1. **Complete Stripe KYC**
   - Provide business information
   - Bank account details
   - Wait for approval (24-48 hours)

2. **Get Live Keys**
   - Publishable Key: `pk_live_...`
   - Secret Key: `sk_live_...`

3. **Update Environment Variables**
   - Set in Manus Settings → Payment
   - Do NOT commit to git

## Email Configuration

### SMTP Setup

Email delivery uses Nodemailer with environment-configured SMTP:

```typescript
// server/email.ts
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});
```

### Testing Email

1. **Development:** Emails logged to console
2. **Production:** Emails sent via configured SMTP

## Deployment Process

### Automatic Deployment (GitHub Integration)

1. **Push to Main Branch**
```bash
git add .
git commit -m "Feature: Add crew skills"
git push origin main
```

2. **Manus Platform Detects Changes**
   - Runs tests
   - Builds frontend (Vite)
   - Builds backend (Node.js)
   - Deploys to Cloud Run

3. **Deployment Status**
   - Check Manus Dashboard → Deployments
   - View logs in real-time
   - Rollback if needed

### Manual Deployment

1. **Create Checkpoint**
```bash
# Via Manus UI: Click "Save Checkpoint"
# Or via CLI: manus checkpoint create
```

2. **Publish**
   - Click "Publish" button in Manus UI
   - Select checkpoint to deploy
   - Confirm deployment

3. **Verify**
   - Visit deployed URL
   - Test key features
   - Monitor error logs

## Domain Configuration

### Auto-Generated Domain

Your app is available at: `roofcrm-lzqinayu.manus.space`

### Custom Domain Setup

1. **Purchase Domain**
   - Via Manus: Settings → Domains → Buy Domain
   - Or use existing domain

2. **Configure DNS**
   - Point domain to: `roofcrm-lzqinayu.manus.space`
   - Add CNAME record: `your-domain.com CNAME roofcrm-lzqinayu.manus.space`

3. **Enable SSL**
   - Automatic via Let's Encrypt
   - Takes 5-10 minutes

4. **Verify**
   - Visit `https://your-domain.com`
   - Check SSL certificate

## Monitoring & Logging

### Application Logs

Located in `.manus-logs/`:
- `devserver.log` - Server startup and errors
- `browserConsole.log` - Frontend console output
- `networkRequests.log` - HTTP requests
- `sessionReplay.log` - User interactions

### Error Tracking

1. **Development**
   - Check browser console (F12)
   - Check server logs
   - Check `.manus-logs/` files

2. **Production**
   - Access logs via Manus Dashboard
   - Set up error alerts
   - Monitor performance metrics

### Performance Monitoring

- Frontend: Lighthouse scores
- Backend: Response times
- Database: Query performance
- Stripe: Payment success rate

## Scaling Considerations

### Vertical Scaling
- Increase Cloud Run memory/CPU
- Upgrade TiDB cluster tier
- Increase Redis cache size

### Horizontal Scaling
- Multiple Cloud Run instances
- Database read replicas
- CDN for static assets

### Optimization
- Enable query caching
- Compress responses
- Optimize images
- Lazy load components

## Backup & Recovery

### Database Backups

**Automatic:**
- TiDB Cloud: Daily backups
- Retention: 30 days
- Restore point-in-time

**Manual:**
```bash
# Export database
mysqldump -h host -u user -p database > backup.sql

# Restore database
mysql -h host -u user -p database < backup.sql
```

### Application Backups

- GitHub: All code history
- Manus: Checkpoint versions
- S3: File uploads

### Disaster Recovery

1. **Database Loss**
   - Restore from TiDB backup
   - Re-run migrations if needed
   - Verify data integrity

2. **Application Corruption**
   - Rollback to previous checkpoint
   - Or redeploy from git

3. **Data Loss**
   - Restore from S3 backups
   - Check GitHub history
   - Contact support

## Security Best Practices

### Secrets Management

- [ ] Never commit `.env` files
- [ ] Use environment variables for all secrets
- [ ] Rotate API keys regularly
- [ ] Use separate keys for dev/prod
- [ ] Enable 2FA on Stripe/GitHub

### Database Security

- [ ] Enable SSL for database connections
- [ ] Use strong passwords
- [ ] Restrict IP access
- [ ] Enable audit logging
- [ ] Regular security updates

### Application Security

- [ ] Keep dependencies updated
- [ ] Run security audits (`npm audit`)
- [ ] Enable CORS properly
- [ ] Validate all inputs
- [ ] Use HTTPS everywhere
- [ ] Implement rate limiting

### Compliance

- [ ] PCI DSS: Stripe handles card data
- [ ] GDPR: Implement data export/deletion
- [ ] SOC 2: Regular audits
- [ ] Backups: Regular testing

## Troubleshooting

### Deployment Fails

1. **Check logs**
   - Manus Dashboard → Deployments → View Logs
   - Look for build errors

2. **Common issues**
   - Missing environment variables
   - Database migration errors
   - Dependency conflicts
   - TypeScript errors

3. **Fix and retry**
   - Fix issue locally
   - Run tests
   - Push to git
   - Redeploy

### Database Connection Issues

1. **Verify connection string**
```bash
echo $DATABASE_URL
```

2. **Test connection**
```bash
mysql -h host -u user -p -e "SELECT 1;"
```

3. **Check firewall**
   - TiDB Cloud: Whitelist IP
   - Manus: Verify IP range

### Email Not Sending

1. **Check SMTP config**
   - Verify credentials
   - Test connection
   - Check logs

2. **Common issues**
   - Wrong port (587 vs 465)
   - SSL/TLS mismatch
   - Authentication failure
   - Rate limiting

### Payment Issues

1. **Stripe webhook not firing**
   - Check webhook endpoint URL
   - Verify secret key
   - Check event logs in Stripe Dashboard

2. **Payment stuck**
   - Check payment intent status
   - Verify customer setup
   - Review error messages

## Maintenance

### Regular Tasks

- [ ] Weekly: Check error logs
- [ ] Weekly: Monitor performance
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review security
- [ ] Quarterly: Full backup test
- [ ] Quarterly: Security audit

### Updates

```bash
# Check for updates
pnpm outdated

# Update dependencies
pnpm update

# Update specific package
pnpm add package@latest

# Run tests after update
pnpm test
```

### Database Maintenance

```bash
# Optimize tables
OPTIMIZE TABLE customers, projects, invoices;

# Check table status
CHECK TABLE customers;

# Repair if needed
REPAIR TABLE customers;
```

## Support & Resources

- **Manus Docs:** https://docs.manus.im
- **tRPC Docs:** https://trpc.io
- **Drizzle Docs:** https://orm.drizzle.team
- **Stripe Docs:** https://stripe.com/docs
- **TiDB Docs:** https://docs.pingcap.com

## Rollback Procedure

### Quick Rollback

1. **Via Manus UI**
   - Dashboard → Version History
   - Select previous checkpoint
   - Click "Rollback"

2. **Via Git**
```bash
git revert HEAD
git push origin main
```

### Data Rollback

If data was corrupted:
1. Restore database from backup
2. Verify data integrity
3. Redeploy application
4. Test thoroughly

## Post-Deployment Checklist

- [ ] Application loads without errors
- [ ] Authentication works
- [ ] Database queries execute
- [ ] Stripe payments work
- [ ] Email delivery works
- [ ] PDF generation works
- [ ] File uploads work
- [ ] All features tested
- [ ] Performance acceptable
- [ ] No security warnings
