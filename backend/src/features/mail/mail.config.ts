import { env } from '@/shared/config/env.js';

/** Gmail, or the plain SMTP server SMTP_HOST names (Mailpit locally, web UI on http://localhost:54424). */
export const transportConfig = env.SMTP_HOST
	? { host: env.SMTP_HOST, port: env.SMTP_PORT, secure: false, ignoreTLS: true }
	: {
			service: 'gmail',
			auth: {
				user: env.GMAIL_USER,
				pass: env.GMAIL_APP_PASSWORD,
			},
		};

export const senderConfig = {
	name: 'Zumik',
	email: env.GMAIL_USER,
} as const;

export const verificationConfig = {
	// "false" turns verification off: accounts are created verified, no email.
	enabled: env.EMAIL_VERIFICATION_ENABLED.trim().toLowerCase() !== 'false',
	codeLength: 6,
	expiryMinutes: parseInt(env.EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES),
	maxAttempts: parseInt(env.EMAIL_VERIFICATION_MAX_ATTEMPTS),
	maxResends: parseInt(env.EMAIL_VERIFICATION_MAX_RESENDS_PER_HOUR),
	resendCooldownSeconds: parseInt(env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS),
} as const;
