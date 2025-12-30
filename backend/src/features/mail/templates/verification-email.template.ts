import { EmailTemplate, VerificationEmailData } from "@/features/mail/mail.types.js";
import { colors, renderBaseTemplate, renderTextFooter } from "./base.template.js";

/**
 * Verification email template
 *
 * Generates HTML and plain text versions of the email verification message.
 */

/**
 * Render verification email content (HTML body only, without base wrapper)
 */
function renderVerificationContent(
  code: string,
  expiresInMinutes: number,
): string {
  return `
    <style>
      .title {
        font-size: 24px;
        margin: 0 0 20px 0;
        color: ${colors.textPrimary};
      }
      .description {
        font-size: 16px;
        color: ${colors.textSecondary};
        margin: 0 0 30px 0;
        line-height: 1.5;
      }
      .code-box {
        background: ${colors.primary};
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
        color: ${colors.textSecondary};
        margin: 20px 0 0 0;
      }
    </style>
    <h2 class="title">Verify Your Email</h2>
    <p class="description">
      Enter this verification code in the app to complete your registration:
    </p>
    <div class="code-box">${code}</div>
    <p class="warning">
      This code will expire in <strong>${expiresInMinutes} minutes</strong>.
    </p>
    <p class="warning">
      If you didn't create a Zumik account, please ignore this email.
    </p>
  `;
}

/**
 * Render plain text version of verification email
 */
function renderVerificationText(
  code: string,
  expiresInMinutes: number,
): string {
  return `
Zumik - Email Verification

Your verification code is: ${code}

This code will expire in ${expiresInMinutes} minutes.

If you didn't create a Zumik account, please ignore this email.

${renderTextFooter()}
  `.trim();
}

/**
 * Generate complete verification email template
 *
 * @param data - Verification email data (code and expiry time)
 * @returns Email template with subject, HTML, and text versions
 */
export function renderVerificationEmail(
  data: VerificationEmailData,
): EmailTemplate {
  const { code, expiresInMinutes } = data;
  const content = renderVerificationContent(code, expiresInMinutes);

  return {
    subject: "Verify Your Zumik Account",
    html: renderBaseTemplate(content, "Verify Your Email"),
    text: renderVerificationText(code, expiresInMinutes),
  };
}
