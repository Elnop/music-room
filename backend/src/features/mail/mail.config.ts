import { env } from "@/shared/config/env.js";

/**
 * Mail configuration
 *
 * Centralizes all email-related configuration from environment variables.
 */

/**
 * Gmail SMTP configuration
 */
export const gmailConfig = {
  service: "gmail",
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
} as const;

/**
 * Email sender configuration
 */
export const senderConfig = {
  name: "Music Room",
  email: env.GMAIL_USER,
} as const;

/**
 * Email verification configuration
 */
export const verificationConfig = {
  codeLength: 6,
  expiryMinutes: parseInt(env.EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES),
  maxAttempts: parseInt(env.EMAIL_VERIFICATION_MAX_ATTEMPTS),
  maxResends: parseInt(env.EMAIL_VERIFICATION_MAX_RESENDS_PER_HOUR),
  resendCooldownSeconds: parseInt(
    env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
  ),
} as const;
