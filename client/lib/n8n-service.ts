import { GenerationRequest, GenerationResponse } from './supabase-types';
import { encryptMessage } from './encryption';

// N8N Configuration
const N8N_REPLY_WEBHOOK_URL = import.meta.env.VITE_N8N_REPLY_WEBHOOK_URL;
const N8N_EMAIL_WEBHOOK_URL = import.meta.env.VITE_N8N_EMAIL_WEBHOOK_URL;
const N8N_WEBHOOK_TOKEN = import.meta.env.VITE_N8N_WEBHOOK_TOKEN;

// Check if N8N is configured
export const isN8NConfigured = !!(N8N_REPLY_WEBHOOK_URL && N8N_EMAIL_WEBHOOK_URL);

// Reply generation payload
interface ReplyGenerationPayload {
  originalMessage: string;
  language: string;
  tone: string;
  intent: string;
  encrypted: boolean;
  token?: string;
}

// Email generation payload
interface EmailGenerationPayload {
  prompt: string;
  language: string;
  tone: string;
  encrypted: boolean;
  token?: string;
}

// N8N Response
interface N8NResponse {
  success: boolean;
  content?: string;
  subject?: string; // Only for emails
  error?: string;
}

/**
 * Generate AI reply via N8N
 */
export async function generateAIReply(request: GenerationRequest): Promise<GenerationResponse> {
  if (!isN8NConfigured) {
    console.warn('N8N not configured - using mock response');
    return generateMockReply(request);
  }

  if (request.generationType !== 'reply') {
    throw new Error('Invalid generation type for reply endpoint');
  }

  try {
    const payload: ReplyGenerationPayload = {
      originalMessage: request.originalMessage!,
      language: request.language,
      tone: request.tone,
      intent: request.intent!,
      encrypted: request.encrypted,
      token: N8N_WEBHOOK_TOKEN
    };

    // Encrypt the original message if encryption is enabled
    if (request.encrypted && payload.originalMessage) {
      payload.originalMessage = await encryptMessage(payload.originalMessage);
    }

    const response = await fetch(N8N_REPLY_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`N8N request failed: ${response.status} ${response.statusText}`);
    }

    const data: N8NResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'AI generation failed');
    }

    return {
      success: true,
      content: data.content || ''
    };

  } catch (error: any) {
    console.error('Error generating AI reply:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate reply'
    };
  }
}

/**
 * Generate AI email via N8N
 */
export async function generateAIEmail(request: GenerationRequest): Promise<GenerationResponse> {
  if (!isN8NConfigured) {
    console.warn('N8N not configured - using mock response');
    return generateMockEmail(request);
  }

  if (request.generationType !== 'email') {
    throw new Error('Invalid generation type for email endpoint');
  }

  try {
    const payload: EmailGenerationPayload = {
      prompt: request.prompt!,
      language: request.language,
      tone: request.tone,
      encrypted: request.encrypted,
      token: N8N_WEBHOOK_TOKEN
    };

    // Encrypt the prompt if encryption is enabled
    if (request.encrypted && payload.prompt) {
      payload.prompt = await encryptMessage(payload.prompt);
    }

    const response = await fetch(N8N_EMAIL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`N8N request failed: ${response.status} ${response.statusText}`);
    }

    const data: N8NResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'AI generation failed');
    }

    return {
      success: true,
      content: data.content || '',
      subject: data.subject || ''
    };

  } catch (error: any) {
    console.error('Error generating AI email:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate email'
    };
  }
}

/**
 * Mock reply generation for demo/development
 */
function generateMockReply(request: GenerationRequest): GenerationResponse {
  const mockReplies = {
    'Say Yes': `Thank you for your message. Yes, I can help you with that. I'll get back to you shortly with more details.`,
    'Say No': `Thank you for reaching out. Unfortunately, I won't be able to assist with this particular request at this time.`,
    'Ask for More Info': `Thank you for your email. Could you please provide more details about your requirements? This will help me give you a more accurate response.`,
    'Delay Reply': `Thank you for your message. I'm currently reviewing your request and will get back to you within 24 hours with a comprehensive response.`,
    'Follow Up': `Following up on our previous conversation, I wanted to check if you need any additional information or if there's anything else I can help you with.`,
    'Confirm Something': `Thank you for your email. I can confirm that everything looks good on our end and we can proceed as discussed.`,
    'Decline Politely': `Thank you for thinking of us. While we appreciate the opportunity, we won't be able to move forward with this at this time.`,
    'Request Action': `Thank you for your message. Could you please take the following action to help us move forward with your request?`,
    'Thank Sender': `Thank you so much for your email and for taking the time to reach out. Your message is greatly appreciated.`,
    'Acknowledge Message': `Thank you for your message. I have received it and wanted to acknowledge that I'm reviewing the details.`
  };

  const baseReply = mockReplies[request.intent as keyof typeof mockReplies] || mockReplies['Acknowledge Message'];
  
  // Simulate different tones
  let reply = baseReply;
  switch (request.tone) {
    case 'Friendly':
      reply = `Hi there! ${reply} Have a great day! 😊`;
      break;
    case 'Professional':
      reply = `Dear Sender,\n\n${reply}\n\nBest regards,\n[Your Name]`;
      break;
    case 'Urgent':
      reply = `URGENT: ${reply}`;
      break;
    case 'Apologetic':
      reply = `I apologize for any inconvenience. ${reply}`;
      break;
  }

  return {
    success: true,
    content: reply
  };
}

/**
 * Mock email generation for demo/development
 */
function generateMockEmail(request: GenerationRequest): GenerationResponse {
  const prompt = request.prompt || 'general inquiry';
  
  let subject = `Re: ${prompt.charAt(0).toUpperCase() + prompt.slice(1, 50)}`;
  let content = `Thank you for your interest. Based on your request about "${prompt}", I wanted to provide you with some helpful information.

This is a comprehensive response that addresses your inquiry. Please let me know if you need any additional details or clarification.

Best regards,
[Your Name]`;

  // Adjust for tone
  switch (request.tone) {
    case 'Friendly':
      subject = `😊 ${subject}`;
      content = `Hi there!\n\n${content}\n\nHave a wonderful day!`;
      break;
    case 'Professional':
      content = `Dear Recipient,\n\n${content}\n\nSincerely,\n[Your Name]`;
      break;
    case 'Urgent':
      subject = `URGENT: ${subject}`;
      content = `URGENT RESPONSE REQUIRED\n\n${content}`;
      break;
  }

  return {
    success: true,
    content,
    subject
  };
}

/**
 * Test N8N connectivity
 */
export async function testN8NConnection(): Promise<{ reply: boolean; email: boolean; error?: string }> {
  const results = { reply: false, email: false, error: undefined as string | undefined };

  if (!isN8NConfigured) {
    results.error = 'N8N webhook URLs not configured';
    return results;
  }

  try {
    // Test reply webhook
    try {
      const replyResponse = await fetch(N8N_REPLY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, token: N8N_WEBHOOK_TOKEN })
      });
      results.reply = replyResponse.ok;
    } catch (error) {
      console.warn('Reply webhook test failed:', error);
    }

    // Test email webhook
    try {
      const emailResponse = await fetch(N8N_EMAIL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, token: N8N_WEBHOOK_TOKEN })
      });
      results.email = emailResponse.ok;
    } catch (error) {
      console.warn('Email webhook test failed:', error);
    }

  } catch (error: any) {
    results.error = error.message;
  }

  return results;
}
