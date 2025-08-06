# MailoReply AI - Production Deployment Guide

## Overview

MailoReply AI is a production-ready AI-powered email generation platform with enterprise-grade security, smart device management, and usage tracking. This guide covers complete deployment from setup to production.

## System Requirements

### Backend Requirements
- **Supabase Project** (Required)
- **N8N Instance** (Required for AI generation)
- **Domain with SSL** (Required for production)

### Environment Setup
- Node.js 18+ 
- NPM or Yarn package manager
- Modern web browser

## Pre-Deployment Setup

### 1. Supabase Configuration

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from Settings > API

#### Deploy Database Schema
1. Go to SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase_schema_clean.sql`
3. Execute the SQL to create all tables, functions, and policies

#### Verify Database Setup
```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verify default superuser was created
SELECT email, role FROM users WHERE role = 'superuser';
```

### 2. N8N Configuration

#### Setup N8N Instance
1. Deploy N8N on your preferred platform (Digital Ocean, AWS, etc.)
2. Create two workflows:
   - **AI Reply Workflow**: Handles email reply generation
   - **AI Email Workflow**: Handles new email generation

#### Configure Webhooks
1. Set up webhook URLs:
   - `https://your-n8n-instance.com/webhook/ai-reply`
   - `https://your-n8n-instance.com/webhook/ai-email`
2. Configure webhook authentication tokens
3. Test webhook connectivity

## Deployment Steps

### 1. Environment Configuration

Create `.env` file with your actual values:

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# N8N Integration (REQUIRED)
VITE_N8N_REPLY_WEBHOOK_URL=https://your-n8n-instance.com/webhook/ai-reply
VITE_N8N_EMAIL_WEBHOOK_URL=https://your-n8n-instance.com/webhook/ai-email
VITE_N8N_WEBHOOK_TOKEN=your-webhook-authentication-token

# Optional: Builder.io Integration
VITE_PUBLIC_BUILDER_KEY=your-builder-key
```

### 2. Build and Deploy

#### Option A: Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy with these build settings:
   ```
   Build command: npm run build
   Publish directory: dist
   ```

#### Option B: Manual Deployment
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy dist/ folder to your web server
```

### 3. Initial System Setup

#### First-Time Configuration
1. Navigate to `https://your-domain.com/setup`
2. Create your system administrator account
3. This creates the first superuser and completes setup

#### Post-Setup Verification
1. Login with your administrator account
2. Verify all systems show "Online" in dashboard
3. Test AI generation functionality
4. Check usage indicators are working

## System Architecture

### User Roles & Limits

| Role | Daily Limit | Monthly Limit | Devices | Features |
|------|-------------|---------------|---------|----------|
| Free | 3 | 30 | 1 | Basic templates, email support |
| Pro | Unlimited | 100 | 1 | Premium templates, priority support |
| Pro Plus | Unlimited | Unlimited | 2 | Advanced templates, analytics |
| Enterprise User | Unlimited | Unlimited | Unlimited | All features |
| Enterprise Manager | Unlimited | Unlimited | Unlimited | + Team management |
| Superuser | Unlimited | Unlimited | Unlimited | + System administration |

### Security Features

- **Device Management**: Secure fingerprinting and limits
- **Usage Tracking**: Real-time daily/monthly monitoring
- **Encryption**: Optional AES-256-GCM encryption
- **Authentication**: JWT-based with Supabase Auth
- **Row Level Security**: Database-level access control

## Configuration Management

### Environment Variables

#### Required Variables
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_N8N_REPLY_WEBHOOK_URL=https://n8n.domain.com/webhook/ai-reply
VITE_N8N_EMAIL_WEBHOOK_URL=https://n8n.domain.com/webhook/ai-email
VITE_N8N_WEBHOOK_TOKEN=your-webhook-token
```

#### Optional Variables
```bash
VITE_PUBLIC_BUILDER_KEY=builder-key-for-cms
VITE_GA_TRACKING_ID=google-analytics-id
VITE_SENTRY_DSN=sentry-error-tracking-dsn
```

### Database Functions

The system includes several Supabase functions:

- `can_user_generate(user_uuid)`: Check if user can generate
- `increment_user_usage(user_uuid)`: Increment usage counters
- `reset_daily_usage()`: Reset daily counters (scheduled)
- `reset_monthly_usage()`: Reset monthly counters (scheduled)

## User Management

### Creating Users

#### Free Users
- Self-registration via `/signup`
- Automatic role assignment
- Email verification required

#### Enterprise Users
- Invite-based registration
- Company assignment
- Role-based access control

#### System Administrators
- Created via `/setup` (first time only)
- Full system access
- User and company management

### User Roles Management

```sql
-- Promote user to enterprise manager
UPDATE users SET role = 'enterprise_manager' WHERE email = 'user@company.com';

-- Create company
INSERT INTO companies (name, plan, max_users) 
VALUES ('Company Name', 'enterprise', 100);

-- Assign users to company
UPDATE users SET company_id = 'company-uuid' WHERE email IN ('user1@company.com', 'user2@company.com');
```

## Security Configuration

### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- Users can only see their own data
- Company members can see shared templates
- Enterprise managers can manage their company
- Superusers have full access

### Encryption Configuration

#### Always Encrypt Mode
- Configured per user in settings
- Forces encryption for all AI requests
- Cannot be disabled in UI when enabled

#### Standard Encryption
- User-controlled toggle in AI generator
- Optional encryption for sensitive content
- Client-side encryption before API calls

## Monitoring & Analytics

### Usage Tracking
- Real-time daily/monthly counters
- Cross-platform tracking (website + extension)
- Visual usage indicators (circular charts)
- Device management and limits

### System Health
- AI service connectivity
- Database connection status
- N8N webhook availability
- Encryption service status

## Troubleshooting

### Common Issues

#### "Supabase not configured" Error
- Verify environment variables are set
- Check Supabase project is active
- Confirm anon key permissions

#### "N8N not configured" Error
- Verify webhook URLs are reachable
- Check authentication tokens
- Test webhook endpoints

#### Usage Limits Not Working
- Verify database functions are deployed
- Check user role assignments
- Confirm limit calculations in database

### Database Queries for Debugging

```sql
-- Check user limits and usage
SELECT email, role, daily_limit, daily_usage, monthly_limit, monthly_usage 
FROM users WHERE email = 'user@example.com';

-- Check recent AI generations
SELECT * FROM ai_generations 
WHERE user_id = 'user-uuid' 
ORDER BY created_at DESC LIMIT 10;

-- Check device registrations
SELECT * FROM user_devices 
WHERE user_id = 'user-uuid';

-- Reset user usage (emergency)
UPDATE users SET daily_usage = 0, monthly_usage = 0 
WHERE email = 'user@example.com';
```

## Backup & Recovery

### Database Backups
- Supabase provides automatic backups
- Set up additional backup strategy for critical data
- Test restore procedures regularly

### Configuration Backup
```bash
# Backup environment configuration
cp .env .env.backup

# Backup deployment settings
# Store Netlify/hosting configurations
```

## Performance Optimization

### Database Optimization
- Indexes are created automatically
- Monitor query performance in Supabase
- Set up connection pooling for high traffic

### Frontend Optimization
- Built with Vite for optimal bundling
- Code splitting implemented
- Lazy loading for routes

## Security Checklist

- [ ] Supabase RLS policies verified
- [ ] Environment variables secured
- [ ] HTTPS/SSL configured
- [ ] Webhook authentication implemented
- [ ] User input validation active
- [ ] Error messages don't leak sensitive data
- [ ] Database backups configured
- [ ] Audit logging enabled

## Support & Maintenance

### Regular Maintenance
- Monitor usage statistics
- Update dependencies regularly
- Review audit logs
- Clean up inactive devices

### Scaling Considerations
- Supabase scales automatically
- N8N may need resource scaling
- Monitor API rate limits
- Consider CDN for static assets

## Advanced Configuration

### Custom Domain Setup
1. Configure DNS records
2. Set up SSL certificates
3. Update environment variables
4. Test all functionality

### Integration with Other Services
- Email providers (SMTP configuration)
- Analytics platforms (Google Analytics, etc.)
- Error tracking (Sentry, LogRocket)
- CMS integration (Builder.io)

---

## Quick Start Summary

1. **Setup Supabase**: Create project, deploy schema
2. **Configure N8N**: Setup webhooks and workflows
3. **Set Environment Variables**: Add all required config
4. **Deploy Application**: Use Netlify or preferred host
5. **Run Initial Setup**: Navigate to `/setup`
6. **Verify Functionality**: Test all features work
7. **Create Users**: Add additional administrators and users

Your MailoReply AI platform is now ready for production use!
