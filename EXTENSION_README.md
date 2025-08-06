# MailoReply AI Extension - Supabase Integration Guide

## 🔗 Overview

This guide explains how to connect your existing browser extension to the MailoReply AI Supabase database for seamless template synchronization and usage tracking.

## 🗄️ Database Connection Setup

### 1. Supabase Configuration

Add these environment variables to your extension:

```javascript
// Extension config
const SUPABASE_CONFIG = {
  url: 'YOUR_SUPABASE_PROJECT_URL',
  anonKey: 'YOUR_SUPABASE_ANON_KEY',
  // Note: Use anon key for client-side extension
};
```

### 2. Initialize Supabase Client

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);
```

## 📊 Core Extension Functions

### 1. User Authentication Check

```javascript
// Check if user is authenticated
async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return user;
}

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // User logged in - sync templates
    syncUserTemplates();
  } else if (event === 'SIGNED_OUT') {
    // Clear local templates
    clearLocalTemplates();
  }
});
```

### 2. Template Synchronization

```javascript
// Fetch user templates (private + company)
async function syncUserTemplates() {
  const user = await getCurrentUser();
  if (!user) return [];

  // Get user's own templates
  const { data: privateTemplates } = await supabase
    .from('templates')
    .select('*')
    .eq('user_id', user.id)
    .eq('visibility', 'private')
    .order('created_at', { ascending: false });

  // Get company templates if user belongs to a company
  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single();

  let companyTemplates = [];
  if (userData?.company_id) {
    const { data } = await supabase
      .from('templates')
      .select('*')
      .eq('company_id', userData.company_id)
      .eq('visibility', 'company')
      .order('created_at', { ascending: false });
    
    companyTemplates = data || [];
  }

  const allTemplates = [...(privateTemplates || []), ...companyTemplates];
  
  // Store in extension local storage
  await chrome.storage.local.set({ 
    templates: allTemplates,
    lastSync: Date.now()
  });

  return allTemplates;
}
```

### 3. Hotkey Template Usage

```javascript
// Use template with hotkey
async function useTemplate(templateId, contentLength = 0) {
  const user = await getCurrentUser();
  if (!user) return;

  // Track usage in database
  await supabase.rpc('track_extension_usage', {
    user_uuid: user.id,
    action_type: 'template_use',
    template_id: templateId,
    content_length: contentLength
  });

  // Get template content
  const { data: template } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (template) {
    // Insert template content into active field
    insertTextInActiveField(template.content);
    
    // Update local usage count
    updateLocalTemplateUsage(templateId);
  }
}
```

### 4. Text Expansion Tracking

```javascript
// Track text expansion usage
async function trackTextExpansion(expandedText) {
  const user = await getCurrentUser();
  if (!user) return;

  await supabase.rpc('track_extension_usage', {
    user_uuid: user.id,
    action_type: 'text_expand',
    template_id: null,
    content_length: expandedText.length
  });
}
```

### 5. Usage Limit Checking

```javascript
// Check if user can generate/use templates
async function canUserGenerate() {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc('can_user_generate', {
    user_uuid: user.id
  });

  return data;
}

// Check before each template use
async function beforeTemplateUse(templateId) {
  const canUse = await canUserGenerate();
  
  if (!canUse) {
    // Show upgrade prompt
    showUpgradePrompt();
    return false;
  }
  
  return true;
}
```

## 🔄 Real-time Synchronization

### 1. Listen for Template Updates

```javascript
// Subscribe to template changes
function subscribeToTemplateChanges() {
  const user = getCurrentUser();
  if (!user) return;

  // Listen for user's template changes
  const privateSubscription = supabase
    .channel('user_templates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'templates',
      filter: `user_id=eq.${user.id}`
    }, (payload) => {
      handleTemplateChange(payload);
    })
    .subscribe();

  // Listen for company template changes
  const companySubscription = supabase
    .channel('company_templates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'templates',
      filter: `visibility=eq.company`
    }, (payload) => {
      handleCompanyTemplateChange(payload);
    })
    .subscribe();
}

function handleTemplateChange(payload) {
  if (payload.eventType === 'INSERT') {
    // Add new template to local storage
    addLocalTemplate(payload.new);
  } else if (payload.eventType === 'UPDATE') {
    // Update existing template
    updateLocalTemplate(payload.new);
  } else if (payload.eventType === 'DELETE') {
    // Remove template from local storage
    removeLocalTemplate(payload.old.id);
  }
}
```

## 🎯 Extension-Website Interaction Flow

### 1. Template Creation Flow

```
Website (Templates Page) → Supabase Database → Extension (Real-time Sync)
```

1. User creates template on website
2. Template saved to `templates` table
3. Extension receives real-time update
4. Template appears in extension hotkey list

### 2. Template Usage Flow

```
Extension (Hotkey Press) → Supabase Database → Website (Usage Analytics)
```

1. User presses hotkey in extension
2. Extension calls `track_extension_usage()`
3. Usage recorded in `ai_generations` table
4. Template `usage_count` incremented
5. Website analytics updated in real-time

### 3. User Management Flow

```
Website (Subscription) → Stripe → Supabase → Extension (Limits Update)
```

1. User upgrades subscription on website
2. Stripe webhook updates `user_subscriptions`
3. User role automatically updated in `users` table
4. Extension receives new usage limits

## 🔧 Extension Implementation Example

### Content Script (content.js)

```javascript
// Listen for hotkey combinations
document.addEventListener('keydown', async (event) => {
  // Check for Ctrl+Shift+[key] combinations
  if (event.ctrlKey && event.shiftKey) {
    const templates = await getLocalTemplates();
    const matchingTemplate = templates.find(t => t.hotkey === event.key);
    
    if (matchingTemplate) {
      event.preventDefault();
      
      // Check usage limits
      if (await beforeTemplateUse(matchingTemplate.id)) {
        await useTemplate(matchingTemplate.id);
      }
    }
  }
});

// Insert text into active field
function insertTextInActiveField(text) {
  const activeElement = document.activeElement;
  
  if (activeElement && (
    activeElement.tagName === 'TEXTAREA' || 
    activeElement.tagName === 'INPUT' ||
    activeElement.contentEditable === 'true'
  )) {
    // Insert text at cursor position
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    const value = activeElement.value;
    
    activeElement.value = value.substring(0, start) + text + value.substring(end);
    activeElement.selectionStart = activeElement.selectionEnd = start + text.length;
    
    // Trigger input event
    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
```

### Background Script (background.js)

```javascript
// Initialize when extension starts
chrome.runtime.onStartup.addListener(async () => {
  await syncUserTemplates();
  subscribeToTemplateChanges();
});

// Sync templates when user navigates to website
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      tab.url?.includes('mailoreply.ai')) {
    syncUserTemplates();
  }
});

// Handle auth state changes from website
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_CHANGED') {
    if (message.user) {
      syncUserTemplates();
    } else {
      clearLocalTemplates();
    }
  }
});
```

## 🎛️ Extension Settings

### Sync Configuration

```javascript
// Extension settings
const EXTENSION_CONFIG = {
  syncInterval: 5 * 60 * 1000, // 5 minutes
  maxCachedTemplates: 100,
  hotkeyPrefix: 'Ctrl+Shift+',
  autoSync: true
};

// Periodic sync
setInterval(async () => {
  if (EXTENSION_CONFIG.autoSync) {
    await syncUserTemplates();
  }
}, EXTENSION_CONFIG.syncInterval);
```

## 🔐 Security Considerations

### 1. RLS (Row Level Security)

The database has Row Level Security enabled, ensuring:
- Users can only access their own templates
- Company templates are only visible to company members
- Usage tracking is isolated per user

### 2. Authentication

```javascript
// Always verify authentication before database operations
async function verifyAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}
```

### 3. Error Handling

```javascript
// Robust error handling for extension
async function safeSupabaseCall(operation) {
  try {
    return await operation();
  } catch (error) {
    console.error('Supabase operation failed:', error);
    
    // Show user-friendly message
    if (error.message.includes('Invalid JWT')) {
      showAuthenticationError();
    } else {
      showSyncError();
    }
    
    return null;
  }
}
```

## 🚀 Getting Started Checklist

1. **Configure Supabase Connection**
   - [ ] Add Supabase URL and anon key to extension
   - [ ] Initialize Supabase client

2. **Implement Core Functions**
   - [ ] User authentication check
   - [ ] Template synchronization
   - [ ] Usage tracking
   - [ ] Hotkey handling

3. **Add Real-time Features**
   - [ ] Subscribe to template changes
   - [ ] Handle sync events
   - [ ] Update local cache

4. **Test Integration**
   - [ ] Create template on website
   - [ ] Verify template appears in extension
   - [ ] Test hotkey functionality
   - [ ] Confirm usage tracking

5. **Deploy**
   - [ ] Package extension with Supabase integration
   - [ ] Test with production database
   - [ ] Monitor sync performance

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase connection in Network tab
3. Ensure user is authenticated on website
4. Check template visibility settings

The extension will work seamlessly with the website's template management system once properly configured!
