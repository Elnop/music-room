import nodemailer from 'nodemailer';
import { transportConfig, senderConfig } from '@/features/mail/mail.config.js';
import { logger } from '@/shared/utils/logger.js';

/**
 * Simple email service with inline templates
 *
 * Sends transactional emails via Gmail SMTP (Mailpit in local development).
 * No classes, no registry pattern - just direct functions.
 */

// Singleton transporter (lazy initialization)
let transporter: nodemailer.Transporter;

function getTransporter(): nodemailer.Transporter {
	if (!transporter) {
		transporter = nodemailer.createTransport(transportConfig);
	}
	return transporter;
}

/**
 * HTML base wrapper for all emails
 */
function wrapInBaseHtml(content: string, title: string): string {
	return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #121212; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; padding: 32px; background-color: #1e1e1e; border-radius: 12px;">
    ${content}
    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #333; text-align: center;">
      <p style="color: #666; font-size: 12px; margin: 0;">
        This email was sent from Zumik
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send email verification code
 *
 * @param email - Recipient email address
 * @param code - 6-digit verification code
 * @param expiresInMinutes - Code expiration time
 */
export async function sendVerificationEmail(
	email: string,
	code: string,
	expiresInMinutes: number
): Promise<void> {
	const html = wrapInBaseHtml(
		`
    <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 24px 0;">
      Verify Your Email
    </h1>
    <p style="color: #b3b3b3; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
      Welcome to Zumik! Enter this code to verify your account:
    </p>

    <div style="background-color: #181818; border: 2px solid #1DB954; border-radius: 12px; padding: 32px; text-align: center; margin: 24px 0;">
      <div style="font-family: 'Courier New', monospace; font-size: 48px; font-weight: bold; color: #1DB954; letter-spacing: 8px;">
        ${code}
      </div>
    </div>

    <p style="color: #b3b3b3; font-size: 14px; line-height: 20px; margin: 16px 0;">
      ⏱️ This code will expire in <strong style="color: #ffffff;">${expiresInMinutes} minutes</strong>.
    </p>
    <p style="color: #b3b3b3; font-size: 14px; line-height: 20px; margin: 0;">
      🔒 For your security, never share this code with anyone.
    </p>
    `,
		'Verify Your Email'
	);

	const text = `Verify Your Email

Welcome to Zumik! Enter this code to verify your account:

${code}

This code will expire in ${expiresInMinutes} minutes.

For your security, never share this code with anyone.

---
This email was sent from Zumik`;

	await getTransporter().sendMail({
		from: `${senderConfig.name} <${senderConfig.email}>`,
		to: email,
		subject: '🎵 Verify Your Zumik Account',
		html,
		text,
	});

	logger.info('Verification email sent', { to: email });
}

/**
 * Send password reset code
 *
 * @param email - Recipient email address
 * @param code - 6-digit reset code
 * @param expiresInMinutes - Code expiration time
 */
export async function sendPasswordResetEmail(
	email: string,
	code: string,
	expiresInMinutes: number
): Promise<void> {
	const html = wrapInBaseHtml(
		`
    <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 24px 0;">
      Reset Your Password
    </h1>
    <p style="color: #b3b3b3; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
      We received a request to reset your Zumik password. Use this code to set a new password:
    </p>

    <div style="background-color: #181818; border: 2px solid #1DB954; border-radius: 12px; padding: 32px; text-align: center; margin: 24px 0;">
      <div style="font-family: 'Courier New', monospace; font-size: 48px; font-weight: bold; color: #1DB954; letter-spacing: 8px;">
        ${code}
      </div>
    </div>

    <p style="color: #b3b3b3; font-size: 14px; line-height: 20px; margin: 16px 0;">
      ⏱️ This code will expire in <strong style="color: #ffffff;">${expiresInMinutes} minutes</strong>.
    </p>
    <p style="color: #b3b3b3; font-size: 14px; line-height: 20px; margin: 0 0 24px 0;">
      🔒 For your security, never share this code with anyone.
    </p>

    <div style="background-color: #2a1a1a; border-left: 4px solid #ff4444; padding: 16px; border-radius: 4px; margin-top: 24px;">
      <p style="color: #ff8888; font-size: 14px; line-height: 20px; margin: 0;">
        <strong>⚠️ Didn't request this?</strong><br>
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    </div>
    `,
		'Reset Your Password'
	);

	const text = `Reset Your Password

We received a request to reset your Zumik password.

Reset Code: ${code}

This code will expire in ${expiresInMinutes} minutes.

For your security, never share this code with anyone.

⚠️ Didn't request this?
If you didn't request a password reset, you can safely ignore this email.
Your password will remain unchanged.

---
This email was sent from Zumik`;

	await getTransporter().sendMail({
		from: `${senderConfig.name} <${senderConfig.email}>`,
		to: email,
		subject: '🔐 Reset Your Zumik Password',
		html,
		text,
	});

	logger.info('Password reset email sent', { to: email });
}
