# MailoReply AI - Production Ready

AI-powered email generation platform with enterprise-grade security, smart device management, and real-time usage tracking.

## ✨ Features

- **🤖 AI Email Generation**: Generate professional emails and replies in 20+ languages
- **📱 Smart Device Management**: Secure device tracking with role-based limits
- **📊 Real-time Usage Analytics**: Beautiful circular indicators for usage tracking
- **🔐 Enterprise Security**: End-to-end encryption, GDPR compliance, RLS
- **👥 Multi-role Support**: Free, Pro, Pro Plus, Enterprise, and Admin roles
- **🎨 Modern UI**: Clean, responsive interface built with React + Tailwind
- **🔧 Production Ready**: Complete deployment guide and monitoring

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **AI Integration**: N8N workflows with dual webhook URLs
- **Security**: AES-256-GCM encryption, JWT authentication
- **Deployment**: Netlify (recommended) or any static hosting

### User Roles & Limits

| Role | Daily Limit | Monthly Limit | Devices | Price |
|------|-------------|---------------|---------|-------|
| **Free** | 3 emails | 30 emails | 1 device | $0 |
| **Pro** | Unlimited | 100 emails | 1 device | $19/mo |
| **Pro Plus** | Unlimited | Unlimited | 2 devices | $39/mo |
| **Enterprise** | Unlimited | Unlimited | Unlimited | Custom |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- N8N instance (for AI generation)

### 1. Clone & Install
```bash
git clone <repository-url>
cd mailoreply-ai
npm install
```

### 2. Environment Setup
Configure your `.env` file with:
```bash
# Required: Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required: Stripe Integration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Required: N8N Webhooks
VITE_N8N_REPLY_WEBHOOK_URL=https://n8n.domain.com/webhook/ai-reply
VITE_N8N_EMAIL_WEBHOOK_URL=https://n8n.domain.com/webhook/ai-email
VITE_N8N_WEBHOOK_TOKEN=your-webhook-token
```

### 3. Database Setup
Follow the complete database deployment sequence:
1. Create Supabase project
2. Follow **[DATABASE_DEPLOYMENT_FINAL.md](DATABASE_DEPLOYMENT_FINAL.md)**
3. Deploy all 5 SQL files in the correct order

### 4. Development
```bash
npm run dev
```

### 5. Initial Setup
Navigate to `http://localhost:8080/setup` to create your administrator account.

## 📖 Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE_v2.md)**: Complete production deployment
- **[Database Schema](supabase_schema_clean.sql)**: PostgreSQL schema and functions
- **[Environment Config](.env.example)**: All configuration options

## 🔐 Security Features

### Device Management
- Secure device fingerprinting
- Role-based device limits
- Real-time device tracking

### Usage Tracking
- Daily and monthly limits
- Cross-platform tracking (website + extension)
- Visual usage indicators
- Automatic reset functions

### Encryption
- AES-256-GCM client-side encryption
- Optional "always encrypt" mode
- Secure key management
- No plaintext to AI services

### Authentication
- Supabase Auth integration
- JWT tokens with refresh
- Row Level Security (RLS)
- Role-based access control

## 🎯 Usage Examples

### AI Email Generation
```typescript
// Generate a reply
const response = await generateAIReply({
  source: 'website',
  generationType: 'reply',
  originalMessage: 'Thanks for the meeting request...',
  language: 'English',
  tone: 'Professional',
  intent: 'Say Yes',
  encrypted: true
});

// Generate new email
const response = await generateAIEmail({
  source: 'website', 
  generationType: 'email',
  prompt: 'Schedule a follow-up meeting for next week',
  language: 'English',
  tone: 'Friendly',
  encrypted: false
});
```

### Usage Tracking
```typescript
// Check if user can generate
const canGenerate = await canUserGenerate(userId);

// Track generation
await trackGeneration(request, success, errorMessage);

// Get usage stats
const stats = await getUserUsageStats(userId);
// Returns: { dailyUsed, dailyLimit, monthlyUsed, monthlyLimit, deviceCount, deviceLimit, isUnlimited }
```

## 🏢 Enterprise Features

### Team Management
- Multi-company support
- Role-based permissions
- Template sharing
- Usage analytics per team

### Advanced Security
- Company-wide encryption policies
- Audit logging
- Device management
- Access controls

### Customization
- Custom templates
- Branding options
- API integration
- Dedicated support

## 🛠️ Development

### Project Structure
```
├── client/
│   ├── components/        # Reusable UI components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── lib/             # Utilities and services
│   ├── pages/           # Route components
│   └── main.tsx         # App entry point
├── supabase_schema_clean.sql  # Database schema
├── .env.example         # Environment template
└── DEPLOYMENT_GUIDE_v2.md    # Production deployment
```

### Key Components
- **`AuthContext`**: Authentication and user management
- **`UsageIndicator`**: Circular usage visualization
- **`AIGenerator`**: Main email generation interface
- **`Settings`**: User preferences and security
- **`Dashboard`**: Role-based dashboard

### Available Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview build locally
npm run type-check   # TypeScript checking
```

## 🌍 Deployment

### Netlify (Recommended)
1. Connect GitHub repository
2. Set environment variables
3. Deploy with build command: `npm run build`

### Manual Deployment
1. Run `npm run build`
2. Deploy `dist/` folder to any static hosting
3. Configure environment variables

### Environment Variables
See `.env.example` for all configuration options.

## 🔧 Monitoring

### Built-in Monitoring
- System status dashboard
- Usage analytics
- Device tracking
- Error monitoring

### Health Checks
- Supabase connectivity
- N8N webhook status  
- Encryption service
- Authentication system

## 🆘 Support

### Common Issues
- **Supabase Connection**: Check URL and keys in environment
- **N8N Integration**: Verify webhook URLs and authentication
- **Usage Limits**: Check user roles and database functions
- **Device Limits**: Review device registration and limits

### Debug Queries
```sql
-- Check user status
SELECT email, role, daily_usage, monthly_usage FROM users WHERE email = 'user@example.com';

-- View recent generations  
SELECT * FROM ai_generations WHERE user_id = 'uuid' ORDER BY created_at DESC LIMIT 10;

-- Check device registrations
SELECT * FROM user_devices WHERE user_id = 'uuid';
```

## 📝 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

This is a production application. For feature requests or bug reports, please contact the development team.

---

**MailoReply AI** - Transform your email workflow with AI-powered generation, smart device management, and enterprise-grade security.
