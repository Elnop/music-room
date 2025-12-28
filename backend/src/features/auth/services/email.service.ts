import nodemailer from "nodemailer";
import { env } from "@/shared/config/env.js";
import { logger } from "@/shared/utils/logger.js";
import { AppError } from "@/shared/middleware/error-handler.js";

/**
 * Email template for verification code
 */
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Generate HTML email template for verification code
 */
function getVerificationEmailTemplate(
  code: string,
  expiresInMinutes: number,
): EmailTemplate {
  return {
    subject: "Verify Your Music Room Account",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #121212;
            color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo h1 {
            color: #1DB954;
            font-size: 32px;
            margin: 0;
          }
          .content {
            background: #282828;
            border-radius: 12px;
            padding: 40px;
            text-align: center;
          }
          .title {
            font-size: 24px;
            margin: 0 0 20px 0;
            color: #ffffff;
          }
          .description {
            font-size: 16px;
            color: #B3B3B3;
            margin: 0 0 30px 0;
            line-height: 1.5;
          }
          .code-box {
            background: #1DB954;
            color: #000000;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 10px;
            margin: 30px 0;
            font-family: 'Courier New', monospace;
          }
          .warning {
            font-size: 14px;
            color: #B3B3B3;
            margin: 20px 0 0 0;
          }
          .footer {
            text-align: center;
            color: #B3B3B3;
            font-size: 12px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #404040;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>🎵 Music Room</h1>
          </div>
          <div class="content">
            <h2 class="title">Verify Your Email</h2>
            <p class="description">
              Enter this verification code in the app to complete your registration:
            </p>
            <div class="code-box">${code}</div>
            <p class="warning">
              This code will expire in <strong>${expiresInMinutes} minutes</strong>.
            </p>
            <p class="warning">
              If you didn't create a Music Room account, please ignore this email.
            </p>
          </div>
          <div class="footer">
            <p><strong>Music Room</strong></p>
            <p>Collaborative Music Listening Platform</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Music Room - Email Verification

Your verification code is: ${code}

This code will expire in ${expiresInMinutes} minutes.

If you didn't create a Music Room account, please ignore this email.

---
Music Room - Collaborative Music Listening Platform
    `.trim(),
  };
}

/**
 * Email service for sending verification emails via Gmail SMTP
 */
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create Gmail SMTP transporter
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_APP_PASSWORD,
      },
    });
  }

  /**
   * Send verification email with 6-digit code
   */
  async sendVerificationEmail(email: string, code: string): Promise<void> {
    try {
      const expiresInMinutes = parseInt(
        env.EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES,
      );
      const template = getVerificationEmailTemplate(code, expiresInMinutes);

      await this.transporter.sendMail({
        from: `"Music Room" <${env.GMAIL_USER}>`,
        to: email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });

      logger.info("Verification email sent successfully", {
        email,
        codeLength: code.length,
      });
    } catch (error) {
      logger.error("Failed to send verification email", { email, error });
      throw new AppError(
        500,
        "Failed to send verification email. Please try again later.",
        "EMAIL_SEND_ERROR",
      );
    }
  }

  /**
   * Verify Gmail SMTP connection (health check)
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info("Gmail SMTP connection verified successfully");
      return true;
    } catch (error) {
      logger.error("Gmail SMTP connection failed", { error });
      return false;
    }
  }
}
