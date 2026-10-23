import type { Request, Response } from 'express';
import { verifyEmailSchema, resendVerificationSchema } from '@/features/auth/auth.validators.js';
import * as verifyEmailService from '@/features/auth/services/verify-email.service.js';
import * as verificationResendService from '@/features/auth/services/verification-resend.service.js';
import { requestIp } from '@/shared/security/request-ip.js';
import { logger } from '@/shared/utils/logger.js';
import { sendSuccess } from '@/shared/utils/send-success.js';

export async function verifyEmail(req: Request, res: Response) {
	const { userId, code } = verifyEmailSchema.parse(req.body);
	const ip = requestIp(req);

	logger.info('Email verification attempt', { userId, ip });
	sendSuccess(res, await verifyEmailService.verifyEmail(userId, code, ip));
}

/** Same answer whether or not a code was sent: no account enumeration. */
export async function resendVerification(req: Request, res: Response) {
	const { userId, email } = resendVerificationSchema.parse(req.body);
	const ip = requestIp(req);

	logger.info('Resend verification request', { userId, ip });
	await verificationResendService.resendCode(userId, email, ip);

	sendSuccess(res, { message: 'Verification code sent. Please check your email.' });
}
