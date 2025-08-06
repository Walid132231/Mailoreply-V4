import { supabase, isSupabaseConfigured } from './supabase';

// Email service configuration
interface EmailConfig {
  provider: 'sendgrid' | 'aws-ses' | 'resend' | 'custom';
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

// Email template data interface
interface InvitationEmailData {
  to: string;
  name: string;
  company_name: string;
  manager_name: string;
  manager_email: string;
  invitation_url: string;
  expires_at: string;
  role: string;
}

class EnterpriseEmailService {
  private config: EmailConfig;

  constructor() {
    this.config = {
      provider: (process.env.EMAIL_PROVIDER as any) || 'sendgrid',
      apiKey: process.env.EMAIL_API_KEY || '',
      fromEmail: process.env.FROM_EMAIL || 'noreply@mailoreply.ai',
      fromName: process.env.FROM_NAME || 'MailoReply AI'
    };
  }

  /**
   * Send enterprise invitation email
   */
  async sendInvitation(invitationData: InvitationEmailData): Promise<boolean> {
    try {
      const emailContent = this.generateInvitationEmail(invitationData);
      
      switch (this.config.provider) {
        case 'sendgrid':
          return await this.sendViaSendGrid(emailContent);
        case 'aws-ses':
          return await this.sendViaAWSSES(emailContent);
        case 'resend':
          return await this.sendViaResend(emailContent);
        default:
          return await this.sendViaCustomProvider(emailContent);
      }
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return false;
    }
  }

  /**
   * Send bulk invitation emails
   */
  async sendBulkInvitations(invitations: InvitationEmailData[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    // Process in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < invitations.length; i += batchSize) {
      const batch = invitations.slice(i, i + batchSize);
      
      const promises = batch.map(async (invitation) => {
        try {
          const result = await this.sendInvitation(invitation);
          return result ? 'success' : 'failed';
        } catch (error) {
          console.error(`Failed to send invitation to ${invitation.to}:`, error);
          return 'failed';
        }
      });

      const results = await Promise.all(promises);
      success += results.filter(r => r === 'success').length;
      failed += results.filter(r => r === 'failed').length;

      // Small delay between batches
      if (i + batchSize < invitations.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { success, failed };
  }

  /**
   * Generate invitation email HTML content
   */
  private generateInvitationEmail(data: InvitationEmailData): {
    to: string;
    subject: string;
    html: string;
    text: string;
  } {
    const expiryDate = new Date(data.expires_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `You're invited to join ${data.company_name} on MailoReply AI`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enterprise Invitation - MailoReply AI</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 20px; }
        .invitation-card { background: #f8fafc; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center; border: 2px solid #e2e8f0; }
        .company-logo { width: 60px; height: 60px; background: #667eea; border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 20px 0; }
        .cta-button:hover { opacity: 0.9; }
        .details { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left; }
        .details-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .details-label { font-weight: 600; color: #4a5568; }
        .details-value { color: #2d3748; }
        .footer { background: #2d3748; color: white; padding: 20px; text-align: center; font-size: 14px; }
        .footer a { color: #667eea; text-decoration: none; }
        .security-note { background: #fef5e7; border: 1px solid #f6e05e; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 14px; color: #744210; }
        .urgency { color: #e53e3e; font-weight: 600; }
        @media (max-width: 600px) {
            .content { padding: 20px 15px; }
            .invitation-card { padding: 20px; }
            .cta-button { padding: 12px 24px; font-size: 14px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>MailoReply AI</h1>
            <p>Enterprise Invitation</p>
        </div>

        <!-- Main Content -->
        <div class="content">
            <h2 style="color: #2d3748; margin-bottom: 10px;">Hi ${data.name},</h2>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                <strong>${data.manager_name}</strong> has invited you to join <strong>${data.company_name}</strong> 
                on MailoReply AI, the leading platform for AI-powered email generation and productivity.
            </p>

            <div class="invitation-card">
                <div class="company-logo">${data.company_name.charAt(0)}</div>
                <h3 style="margin: 0 0 10px 0; color: #2d3748;">${data.company_name}</h3>
                <p style="color: #667eea; font-weight: 600; margin: 0 0 20px 0; text-transform: capitalize;">
                    ${data.role.replace('_', ' ')} Access
                </p>
                
                <a href="${data.invitation_url}" class="cta-button">Accept Invitation</a>
                
                <p style="color: #718096; font-size: 14px; margin: 20px 0 0 0;">
                    This invitation expires on <span class="urgency">${expiryDate}</span>
                </p>
            </div>

            <div class="details">
                <h4 style="margin: 0 0 15px 0; color: #2d3748;">Invitation Details</h4>
                <div class="details-row">
                    <span class="details-label">Company:</span>
                    <span class="details-value">${data.company_name}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Invited by:</span>
                    <span class="details-value">${data.manager_name}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Role:</span>
                    <span class="details-value" style="text-transform: capitalize;">${data.role.replace('_', ' ')}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Expires:</span>
                    <span class="details-value urgency">${expiryDate}</span>
                </div>
            </div>

            <div class="security-note">
                <strong>🔒 Security Note:</strong> This invitation is specifically for ${data.to}. 
                If you didn't expect this invitation or have concerns, please contact ${data.manager_name} 
                at ${data.manager_email}.
            </div>

            <h3 style="color: #2d3748; margin: 30px 0 15px 0;">What you'll get:</h3>
            <ul style="color: #4a5568; line-height: 1.8;">
                <li>🤖 AI-powered email generation and replies</li>
                <li>📝 Shared company templates and knowledge base</li>
                <li>🚀 Chrome extension for seamless email workflow</li>
                <li>📊 Team collaboration and analytics</li>
                <li>🔐 Enterprise-grade security and encryption</li>
                <li>👥 Priority support and training</li>
            </ul>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                Ready to transform your email productivity? 
                <a href="${data.invitation_url}" style="color: #667eea; text-decoration: none; font-weight: 600;">
                    Accept your invitation now →
                </a>
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0;">

            <p style="color: #718096; font-size: 14px; line-height: 1.6;">
                If the button above doesn't work, copy and paste this link into your browser:<br>
                <a href="${data.invitation_url}" style="color: #667eea; word-break: break-all;">${data.invitation_url}</a>
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p style="margin: 0 0 10px 0;">
                <strong>MailoReply AI</strong> - AI-Powered Email Productivity
            </p>
            <p style="margin: 0; color: #a0aec0;">
                If you have questions, contact us at <a href="mailto:support@mailoreply.ai">support@mailoreply.ai</a>
            </p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Hi ${data.name},

${data.manager_name} has invited you to join ${data.company_name} on MailoReply AI.

Accept your invitation: ${data.invitation_url}

This invitation expires on ${expiryDate}.

What you'll get:
- AI-powered email generation and replies
- Shared company templates and knowledge base  
- Chrome extension for seamless email workflow
- Team collaboration and analytics
- Enterprise-grade security and encryption
- Priority support and training

Questions? Contact ${data.manager_name} at ${data.manager_email}

--
MailoReply AI
support@mailoreply.ai
`;

    return {
      to: data.to,
      subject,
      html,
      text
    };
  }

  /**
   * Send email via SendGrid
   */
  private async sendViaSendGrid(emailContent: any): Promise<boolean> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: emailContent.to }] }],
          from: { email: this.config.fromEmail, name: this.config.fromName },
          subject: emailContent.subject,
          content: [
            { type: 'text/plain', value: emailContent.text },
            { type: 'text/html', value: emailContent.html }
          ]
        })
      });

      return response.status === 202;
    } catch (error) {
      console.error('SendGrid error:', error);
      return false;
    }
  }

  /**
   * Send email via AWS SES
   */
  private async sendViaAWSSES(emailContent: any): Promise<boolean> {
    // Implementation would use AWS SDK
    console.log('AWS SES sending not implemented yet');
    return false;
  }

  /**
   * Send email via Resend
   */
  private async sendViaResend(emailContent: any): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.config.fromName} <${this.config.fromEmail}>`,
          to: [emailContent.to],
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Resend error:', error);
      return false;
    }
  }

  /**
   * Send via custom provider
   */
  private async sendViaCustomProvider(emailContent: any): Promise<boolean> {
    // Implement your custom email provider logic here
    console.log('Custom email provider sending:', emailContent.subject);
    return true; // Always return true for demo
  }
}

// Export singleton instance
export const enterpriseEmailService = new EnterpriseEmailService();

// Helper functions
export const sendEnterpriseInvitation = async (invitationData: InvitationEmailData): Promise<boolean> => {
  return enterpriseEmailService.sendInvitation(invitationData);
};

export const sendBulkEnterpriseInvitations = async (invitations: InvitationEmailData[]): Promise<{ success: number; failed: number }> => {
  return enterpriseEmailService.sendBulkInvitations(invitations);
};

// Email template preview function (for testing)
export const previewInvitationEmail = (invitationData: InvitationEmailData): string => {
  const service = new EnterpriseEmailService();
  return (service as any).generateInvitationEmail(invitationData).html;
};