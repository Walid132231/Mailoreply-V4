# 🏠 MailoReply AI - Localhost Deployment Guide

## 📋 **Prerequisites**

Before deploying locally, ensure you have:

- **Node.js** 18.0.0 or higher ([Download here](https://nodejs.org/))
- **npm** 8.0.0 or higher (comes with Node.js)
- **yarn** (recommended package manager)
- **Git** (for cloning/managing code)

### **Install yarn globally:**
```bash
npm install -g yarn
```

---

## 🚀 **Step-by-Step Deployment**

### **Step 1: Project Setup**
```bash
# Navigate to your project directory
cd /path/to/your/mailoreply-ai

# Install dependencies
yarn install

# Verify installation
yarn --version
node --version
```

### **Step 2: Environment Configuration**
Create and configure your `.env` file:

```bash
# Copy the example (if it exists) or create new
cp .env.example .env
# OR create new .env file
touch .env
```

**Edit `.env` with your configuration:**
```env
# ==============================================
# SUPABASE CONFIGURATION (REQUIRED)
# ==============================================
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ==============================================
# STRIPE INTEGRATION (REQUIRED FOR BILLING)
# ==============================================
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ==============================================
# N8N INTEGRATION (REQUIRED FOR AI GENERATION)
# ==============================================
VITE_N8N_REPLY_WEBHOOK_URL=https://your-n8n.com/webhook/ai-reply
VITE_N8N_EMAIL_WEBHOOK_URL=https://your-n8n.com/webhook/ai-email
VITE_N8N_WEBHOOK_TOKEN=your-webhook-token

# ==============================================
# DEVELOPMENT SETTINGS
# ==============================================
NODE_ENV=development
PORT=3000
```

### **Step 3: Database Setup**
Deploy the database schema to your Supabase project:

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Deploy schemas in this exact order:**

```sql
-- 1. Core Schema (REQUIRED FIRST)
-- Copy and run: supabase_schema_clean.sql

-- 2. User Limits (REQUIRED SECOND)  
-- Copy and run: complete_user_limits_update.sql

-- 3. Template Management (REQUIRED THIRD)
-- Copy and run: enhanced_template_management.sql

-- 4. Stripe Integration (REQUIRED FOURTH)
-- Copy and run: supabase_stripe_schema_compatible.sql

-- 5. Enterprise Features (REQUIRED FIFTH)
-- Copy and run: enterprise_invitation_system.sql
```

### **Step 4: Build the Project**
```bash
# Build the server
yarn build:server

# Verify build
ls -la dist/server/
# You should see: node-build.mjs
```

### **Step 5: Start Development Server**
```bash
# Start development server
yarn dev

# The application will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3000/api
```

---

## 🔧 **Development Scripts**

### **Available Commands:**
```bash
# Development (with hot reload)
yarn dev

# Build for production
yarn build

# Build server only
yarn build:server  

# Preview production build
yarn preview

# Start production server
yarn start

# Type checking
yarn type-check

# Linting
yarn lint
```

### **Development Workflow:**
```bash
# 1. Start development server
yarn dev

# 2. Open browser to http://localhost:3000

# 3. Make changes to code (auto-reloads)

# 4. Test features in browser
```

---

## 🗄️ **Database Management**

### **Verify Database Setup:**
1. Go to **Supabase Dashboard** → **Table Editor**
2. **Check these tables exist:**
   - ✅ `users` - User accounts
   - ✅ `companies` - Enterprise companies
   - ✅ `templates` - Email templates
   - ✅ `ai_generations` - Usage tracking
   - ✅ `user_subscriptions` - Stripe subscriptions
   - ✅ `user_invitations` - Enterprise invitations

### **Create Test Data:**
```sql
-- Create a test superuser (run in Supabase SQL Editor)
INSERT INTO users (id, name, email, role, status) VALUES
('test-super-user-id', 'Super Admin', 'admin@mailoreply.ai', 'superuser', 'active');

-- Create a test company
INSERT INTO companies (id, name, plan_type, max_users) VALUES 
('test-company-id', 'Test Company', 'enterprise', 25);
```

---

## 🧪 **Testing Your Setup**

### **1. Frontend Testing:**
```bash
# Open browser to: http://localhost:3000

# Test these pages:
✅ Login page: http://localhost:3000/login
✅ Signup page: http://localhost:3000/signup  
✅ Dashboard: http://localhost:3000/dashboard
✅ SuperAdmin: http://localhost:3000/dashboard/super-admin
```

### **2. API Testing:**
```bash
# Test backend API (using curl or Postman)
curl http://localhost:3000/api/demo

# Should return: {"message": "Demo endpoint working"}
```

### **3. Feature Testing:**
- **✅ Login/Signup**: Create test accounts
- **✅ SuperAdmin Dashboard**: Check enterprise management
- **✅ Stripe Integration**: Test subscription flows (sandbox)
- **✅ N8N Integration**: Test AI generation (if configured)

---

## 🐛 **Troubleshooting**

### **Common Issues:**

#### **1. "Module not found" errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules yarn.lock
yarn install
```

#### **2. "EADDRINUSE: address already in use" error:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
yarn dev --port 3001
```

#### **3. TypeScript errors:**
```bash
# Check TypeScript configuration
yarn type-check

# Fix path mapping issues
cat tsconfig.json
```

#### **4. Supabase connection issues:**
```bash
# Verify environment variables
cat .env | grep SUPABASE

# Test connection in browser console:
# Open DevTools → Console → Run:
console.log(import.meta.env.VITE_SUPABASE_URL);
```

#### **5. Build failures:**
```bash
# Clean build cache
rm -rf dist/

# Rebuild everything  
yarn build:server
yarn build
```

### **Environment Variables Check:**
```bash
# Verify all required variables are set
node -e "
require('dotenv').config();
const required = [
  'VITE_SUPABASE_URL', 
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];
required.forEach(key => {
  console.log(\`\${key}: \${process.env[key] ? '✅ SET' : '❌ MISSING'}\`);
});
"
```

---

## 🚀 **Production Preparation**

### **Before deploying to production:**

1. **Environment Variables:**
   ```bash
   # Update .env for production
   NODE_ENV=production
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Live Stripe keys
   STRIPE_SECRET_KEY=sk_live_...
   ```

2. **Build Production:**
   ```bash
   yarn build
   yarn build:server
   ```

3. **Test Production Build:**
   ```bash
   yarn preview
   # Test at: http://localhost:3000
   ```

---

## 📞 **Support**

### **If you encounter issues:**

1. **Check the logs:**
   ```bash
   # Development server logs
   yarn dev --verbose
   
   # Check browser console
   # Open DevTools → Console
   ```

2. **Verify file structure:**
   ```bash
   ls -la client/       # React frontend
   ls -la server/       # Express backend  
   ls -la dist/         # Built files
   ```

3. **Database issues:**
   - Check Supabase Dashboard → Database → Logs
   - Verify all SQL schemas deployed successfully
   - Test connections in SQL Editor

**✅ Your MailoReply AI application should now be running at http://localhost:3000**

**🎉 Happy coding! Your enterprise-grade AI email platform is ready for development.**