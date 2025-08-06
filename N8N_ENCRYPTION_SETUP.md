# 🔐 N8N Encryption/Decryption Setup Guide

## Overview
This guide shows how to set up encryption and decryption in N8N workflows to handle encrypted content from MailoReply AI users.

## 🎯 **Encryption Flow Architecture**

```
User (Browser) → Encrypt → Send to N8N → Decrypt → Process → Encrypt → Send Response → Decrypt (Browser)
```

## 📋 **N8N Workflow Configuration**

### **Step 1: Create Encryption Helper Function**

Create a new **Function Node** called "Encryption Helper":

```javascript
// N8N Function Node: Encryption Helper
const crypto = require('crypto');

class N8NEncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 12;  // 96 bits for GCM
    this.tagLength = 16; // 128 bits
  }
  
  // Derive user-specific key (same logic as frontend)
  deriveUserKey(userId, userEmail = 'unknown') {
    const keyMaterial = `mailoreply-user-${userId}-${userEmail}`;
    const salt = `mailoreply-salt-${userId}-v2`;
    
    return crypto.pbkdf2Sync(keyMaterial, salt, 100000, this.keyLength, 'sha256');
  }
  
  // Decrypt message from frontend
  decrypt(encryptedData, userId, userEmail) {
    try {
      // Remove version prefix if present
      let dataToDecrypt = encryptedData;
      if (encryptedData.startsWith('v2:')) {
        dataToDecrypt = encryptedData.substring(3);
      }
      
      // Decode base64
      const combined = Buffer.from(dataToDecrypt, 'base64');
      
      // Extract IV, tag, and ciphertext
      const iv = combined.slice(0, this.ivLength);
      const tag = combined.slice(-this.tagLength);
      const ciphertext = combined.slice(this.ivLength, -this.tagLength);
      
      // Derive key
      const key = this.deriveUserKey(userId, userEmail);
      
      // Decrypt
      const decipher = crypto.createDecipherGCM(this.algorithm, key);
      decipher.setIV(iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(ciphertext, null, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
  
  // Encrypt message for frontend
  encrypt(plaintext, userId, userEmail) {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Derive key
      const key = this.deriveUserKey(userId, userEmail);
      
      // Encrypt
      const cipher = crypto.createCipherGCM(this.algorithm, key);
      cipher.setIV(iv);
      
      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      // Combine IV + ciphertext + tag
      const combined = Buffer.concat([iv, encrypted, tag]);
      
      // Return with version prefix
      return 'v2:' + combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }
}

// Export for use in workflow
const encryptionService = new N8NEncryptionService();

return [{ 
  encryptionService,
  // Helper methods for easy access
  decrypt: (data, userId, userEmail) => encryptionService.decrypt(data, userId, userEmail),
  encrypt: (data, userId, userEmail) => encryptionService.encrypt(data, userId, userEmail)
}];
```

### **Step 2: Create Decryption Node**

Create a **Function Node** called "Decrypt Input":

```javascript
// N8N Function Node: Decrypt Input
const { encryptionService } = $node["Encryption Helper"].first();

// Get user data and encrypted content from webhook
const userId = $json.user_id;
const userEmail = $json.user_email;
const encryptedContent = $json.originalMessage || $json.prompt;
const isEncrypted = $json.encrypted === true;

let decryptedContent = encryptedContent;

if (isEncrypted && encryptedContent) {
  try {
    console.log(`Decrypting content for user ${userId}`);
    decryptedContent = encryptionService.decrypt(encryptedContent, userId, userEmail);
    console.log('Decryption successful');
  } catch (error) {
    console.error('Decryption failed:', error.message);
    // Return error response
    return [{
      error: 'DECRYPTION_FAILED',
      message: 'Unable to decrypt content. Please check your encryption settings.',
      success: false
    }];
  }
}

// Return decrypted content for AI processing
return [{
  ...($json),
  originalMessage: decryptedContent,
  prompt: decryptedContent,
  decrypted: isEncrypted,
  processingReady: true
}];
```

### **Step 3: Create Encryption Node**

Create a **Function Node** called "Encrypt Output":

```javascript
// N8N Function Node: Encrypt Output
const { encryptionService } = $node["Encryption Helper"].first();

// Get AI response and user data
const aiResponse = $json.generated_content || $json.response;
const userId = $json.user_id;
const userEmail = $json.user_email;
const shouldEncrypt = $json.encrypted === true || $json.decrypted === true;

let finalResponse = aiResponse;

if (shouldEncrypt && aiResponse) {
  try {
    console.log(`Encrypting response for user ${userId}`);
    finalResponse = encryptionService.encrypt(aiResponse, userId, userEmail);
    console.log('Encryption successful');
  } catch (error) {
    console.error('Encryption failed:', error.message);
    // Return unencrypted response with warning
    finalResponse = aiResponse;
    console.warn('Sending unencrypted response due to encryption failure');
  }
}

// Return final response
return [{
  generated_content: finalResponse,
  success: true,
  encrypted: shouldEncrypt,
  user_id: userId,
  timestamp: new Date().toISOString()
}];
```

## 🔄 **Complete N8N Workflow Structure**

### **1. Webhook Trigger**
- **Node**: HTTP Request
- **Method**: POST
- **Path**: `/ai-generate`
- **Response**: Immediate Response

### **2. Input Validation**
```javascript
// Validate required fields
const requiredFields = ['user_id', 'originalMessage', 'generationType', 'language', 'tone'];
const missingFields = requiredFields.filter(field => !$json[field]);

if (missingFields.length > 0) {
  return [{
    error: 'VALIDATION_FAILED',
    message: `Missing required fields: ${missingFields.join(', ')}`,
    success: false
  }];
}

return [$json];
```

### **3. Encryption Helper** (Function Node above)

### **4. Decrypt Input** (Function Node above)

### **5. AI Processing** 
- **Node**: HTTP Request to AI Service (OpenAI, Claude, etc.)
- Configure with your AI API credentials

### **6. Encrypt Output** (Function Node above)

### **7. Response**
```javascript
// Final response formatting
return [{
  success: true,
  generated_content: $json.generated_content,
  encrypted: $json.encrypted,
  user_id: $json.user_id,
  processing_time: Date.now() - $json.start_time
}];
```

## ⚙️ **Environment Variables**

Set these in N8N Environment Variables:

```bash
# AI Service Configuration
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key

# Encryption Configuration  
ENCRYPTION_ENABLED=true
ENCRYPTION_DEBUG=false

# Security
ALLOWED_ORIGINS=https://yourdomain.com
```

## 🧪 **Testing the Setup**

### **Test Encryption/Decryption**

Create a test workflow node:

```javascript
// Test Node
const { encryptionService } = $node["Encryption Helper"].first();

const testUserId = 'test-user-123';
const testEmail = 'test@example.com';
const testMessage = 'Hello, this is a test message for encryption!';

try {
  console.log('Original:', testMessage);
  
  // Encrypt
  const encrypted = encryptionService.encrypt(testMessage, testUserId, testEmail);
  console.log('Encrypted:', encrypted);
  
  // Decrypt
  const decrypted = encryptionService.decrypt(encrypted, testUserId, testEmail);
  console.log('Decrypted:', decrypted);
  
  const success = testMessage === decrypted;
  console.log('Test Result:', success ? 'PASS' : 'FAIL');
  
  return [{ 
    test: 'encryption',
    success,
    original: testMessage,
    encrypted,
    decrypted,
    match: testMessage === decrypted
  }];
} catch (error) {
  console.error('Test failed:', error);
  return [{ 
    test: 'encryption',
    success: false,
    error: error.message
  }];
}
```

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **Decryption Fails**: 
   - Check user_id and user_email match exactly
   - Verify base64 encoding is intact
   - Check for version prefix (v2:)

2. **Key Mismatch**:
   - Ensure same key derivation parameters
   - Verify salt and key material match frontend

3. **Buffer Errors**:
   - Check IV and tag lengths
   - Verify GCM mode configuration

### **Debug Mode**:

Add debug logging to any node:

```javascript
// Debug logging
if (process.env.ENCRYPTION_DEBUG === 'true') {
  console.log('Debug - User ID:', $json.user_id);
  console.log('Debug - Encrypted:', $json.encrypted);
  console.log('Debug - Content Length:', $json.originalMessage?.length);
}
```

## 🔒 **Security Best Practices**

1. **Never Log Keys**: Don't log encryption keys or plaintext content
2. **Validate Users**: Always verify user_id before processing
3. **Rate Limiting**: Implement rate limiting on webhook endpoint
4. **HTTPS Only**: Always use HTTPS for webhook endpoints
5. **Input Sanitization**: Sanitize all inputs before processing

## 📊 **Monitoring**

Add monitoring nodes to track:
- Encryption/decryption success rates
- Processing times
- Error rates
- User activity

```javascript
// Monitoring Node
const stats = {
  timestamp: new Date().toISOString(),
  user_id: $json.user_id,
  operation: 'ai_generation',
  encrypted: $json.encrypted,
  success: $json.success,
  processing_time: $json.processing_time
};

// Send to monitoring endpoint or database
return [stats];
```

This setup ensures secure handling of encrypted content while maintaining the same user experience across web and extension platforms.