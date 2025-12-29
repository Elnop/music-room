/**
 * Mail feature types
 *
 * This file defines all TypeScript types used by the mail feature.
 */

/**
 * Email template data structure
 */
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Options for sending an email
 */
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Template data for rendering email templates
 */
export interface TemplateData {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxAttempts: number;
  windowSeconds: number;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  canProceed: boolean;
  remainingSeconds?: number;
  attempts?: number;
}

/**
 * Template renderer function signature
 */
export type TemplateRenderer<T extends TemplateData> = (
  data: T,
) => EmailTemplate;

/**
 * Available template names (for type safety)
 */
export type TemplateName = "verification-email";

/**
 * Verification email template data
 */
export interface VerificationEmailData extends TemplateData {
  code: string;
  expiresInMinutes: number;
}
