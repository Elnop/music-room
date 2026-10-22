import type { Request, Response } from 'express';
import {
	forgotPasswordSchema,
	resetPasswordSchema,
	canResendResetCodeQuerySchema,
} from '@/features/auth/auth.validators.js';
import * as passwordResetService from '@/features/auth/services/password-reset.service.js';
import * as passwordResetLimit from '@/shared/security/password-reset-limit.js';
import { requestIp } from '@/shared/security/request-ip.js';
import { logger } from '@/shared/utils/logger.js';
import { sendSuccess } from '@/shared/utils/send-success.js';

// Password reset: request a code, reset with it, check the resend cooldown.

/** POST /api/auth/forgot-password. Same answer whether the email exists or not. */
export async function forgotPassword(req: Request, res: Response) {
	const { email } = forgotPasswordSchema.parse(req.body);
	const ip = requestIp(req);

	logger.info('Forgot password request', { email, ip });
	await passwordResetService.requestPasswordReset(email, ip);

	sendSuccess(res, { message: 'If this email exists, a reset code has been sent.' });
}

/** POST /api/auth/reset-password */
export async function resetPassword(req: Request, res: Response) {
	const { email, code, newPassword } = resetPasswordSchema.parse(req.body);
	const ip = requestIp(req);

	logger.info('Reset password request', { email, ip });
	await passwordResetService.resetPassword(email, code, newPassword, ip);

	sendSuccess(res, {
		message: 'Password reset successful. You can now log in with your new password.',
	});
}

/** GET /api/auth/reset-password/can-resend */
export async function canResendResetCode(req: Request, res: Response) {
	const { email } = canResendResetCodeQuerySchema.parse(req.query);
	const ip = requestIp(req);

	logger.info('Check resend reset code', { email, ip });
	sendSuccess(res, await passwordResetLimit.status(email, ip));
}
