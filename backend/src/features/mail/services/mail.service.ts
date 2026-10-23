import nodemailer from 'nodemailer';
import { transportConfig, senderConfig } from '@/features/mail/mail.config.js';
import * as templates from '@/features/mail/utils/mail-templates.js';
import { logger } from '@/shared/utils/logger.js';

// Creating it opens no connection: nodemailer connects on the first send.
const transporter = nodemailer.createTransport(transportConfig);

async function send(email: string, content: templates.MailContent): Promise<void> {
	await transporter.sendMail({
		from: `${senderConfig.name} <${senderConfig.email}>`,
		to: email,
		...content,
	});
}

export async function sendVerificationEmail(
	email: string,
	code: string,
	expiresInMinutes: number
): Promise<void> {
	await send(email, templates.verificationEmail(code, expiresInMinutes));
	logger.info('Verification email sent', { to: email });
}

export async function sendPasswordResetEmail(
	email: string,
	code: string,
	expiresInMinutes: number
): Promise<void> {
	await send(email, templates.passwordResetEmail(code, expiresInMinutes));
	logger.info('Password reset email sent', { to: email });
}
