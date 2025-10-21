import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // For development, we'll use a test account
    // In production, you'd use real SMTP credentials
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.EMAIL_PASS || 'ethereal.pass'
      }
    });
  }

  async sendInviteEmail(to: string, password: string, role: string): Promise<boolean> {
    try {
      // For development, we'll just log the email details
      // In production, you'd use real SMTP
      console.log('📧 EMAIL INVITE (Development Mode)');
      console.log('=====================================');
      console.log(`To: ${to}`);
      console.log(`Password: ${password}`);
      console.log(`Role: ${role}`);
      console.log('=====================================');
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  private generateInviteEmailHTML(email: string, password: string, role: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to TempoVoice</title>
          <style>
            body {
              font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #3b82f6, #1d4ed8);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f8fafc;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .credentials {
              background: white;
              border: 2px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .credential-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .credential-item:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #4a5568;
            }
            .value {
              font-family: 'Courier New', monospace;
              background: #f1f5f9;
              padding: 5px 10px;
              border-radius: 4px;
              color: #2d3748;
            }
            .button {
              display: inline-block;
              background: #3b82f6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #718096;
              font-size: 14px;
              margin-top: 30px;
            }
            .warning {
              background: #fef3cd;
              border: 1px solid #fbbf24;
              color: #92400e;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to TempoVoice!</h1>
            <p>Your account has been created successfully</p>
          </div>
          
          <div class="content">
            <h2>Hello!</h2>
            <p>You've been invited to join the TempoVoice dashboard as a <strong>${role}</strong>. Your account is ready to use!</p>
            
            <div class="credentials">
              <h3>🔐 Your Login Credentials</h3>
              <div class="credential-item">
                <span class="label">Email:</span>
                <span class="value">${email}</span>
              </div>
              <div class="credential-item">
                <span class="label">Password:</span>
                <span class="value">${password}</span>
              </div>
              <div class="credential-item">
                <span class="label">Role:</span>
                <span class="value">${role}</span>
              </div>
            </div>

            <div class="warning">
              <strong>⚠️ Important:</strong> Please change your password after your first login for security reasons.
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" class="button">
                🚀 Access Dashboard
              </a>
            </div>

            <h3>What you can do:</h3>
            <ul>
              <li>📞 Create and manage voice AI agents</li>
              <li>📱 Configure phone numbers</li>
              <li>📊 Monitor call analytics</li>
              ${role === 'ADMIN' ? '<li>👥 Manage users and system settings</li>' : ''}
            </ul>

            <div class="footer">
              <p>This email was sent by TempoVoice Dashboard</p>
              <p>If you didn't expect this email, please contact your administrator.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
