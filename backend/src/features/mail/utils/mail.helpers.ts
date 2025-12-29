/**
 * Mail utility functions
 *
 * Reusable helper functions for email operations.
 */

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize email address (lowercase, trim)
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Format sender address for email
 */
export function formatSenderAddress(name: string, email: string): string {
  return `"${name}" <${email}>`;
}

/**
 * Calculate expiration time from minutes
 */
export function calculateExpiryDate(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Check if a date is expired
 */
export function isExpired(expiryDate: Date | string): boolean {
  return new Date(expiryDate) < new Date();
}
