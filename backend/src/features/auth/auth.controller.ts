import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/features/auth/auth.service.js';
import {
	registerSchema,
	loginSchema,
	refreshTokenSchema,
	googleLoginSchema,
	facebookLoginSchema,
	providerParamSchema,
	verifyEmailSchema,
	resendVerificationSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
} from '@/features/auth/auth.validators.js';
import { EmailVerificationService } from '@/features/auth/services/email-verification.service.js';
import { PasswordResetService } from '@/features/auth/services/password-reset.service.js';
import { supabase, createSignInClient } from '@/shared/config/supabase.js';
import type { ApiResponse } from '@/shared/types/global.types.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { logger } from '@/shared/utils/logger.js';
import { bruteForceService } from '@/shared/services/brute-force.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';

const authService = new AuthService();

export class AuthController {
	/**
	 * POST /api/auth/register
	 * Register a new user
	 */
	async register(req: Request, res: Response, next: NextFunction) {
		try {
			logger.debug('Register request received', {
				body: req.body,
				headers: {
					'content-type': req.headers['content-type'],
					'user-agent': req.headers['user-agent'],
				},
			});

			const validated = registerSchema.parse(req.body);
			logger.debug('Validation passed', {
				email: validated.email,
				username: validated.username,
			});

			const result = await authService.register(validated);
			logger.debug('Registration successful', { userId: result.user.id });

			const response: ApiResponse = {
				success: true,
				data: result,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(201).json(response);
		} catch (error) {
			logger.error('Register error', { error });
			next(error);
		}
	}

	/**
	 * POST /api/auth/login
	 * Login user with email and password
	 */
	async login(req: Request, res: Response, next: NextFunction) {
		const body = req.body as { email?: string; password?: string };
		const email = body?.email || 'unknown';
		const ip = req.ip || req.socket.remoteAddress || 'unknown';

		try {
			logger.info('Login request received', {
				email: body?.email,
				hasPassword: !!body?.password,
				contentType: req.headers['content-type'],
				origin: req.headers['origin'],
				ip,
			});

			const validated = loginSchema.parse(req.body);
			logger.info('Login validation passed', { email: validated.email });

			const result = await authService.login(validated);

			// SUCCESS: Reset failed attempts counter
			await bruteForceService.resetFailedAttempts(email, ip);

			logger.info('Login successful', {
				userId: result.user.id,
				email: result.user.email,
				hasAccessToken: !!result.session?.accessToken,
				ip,
			});

			const response: ApiResponse = {
				success: true,
				data: result,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.json(response);
		} catch (error) {
			// FAILURE: Record failed attempt and IP activity
			const lockStatus = await bruteForceService.recordFailedAttempt(email, ip);
			await bruteForceService.recordIPActivity(ip);

			logger.warn('Login failed', {
				error: error instanceof Error ? error.message : 'Unknown error',
				email,
				ip,
				failedAttempts: lockStatus.failedAttempts,
				remainingAttempts: lockStatus.remainingAttempts,
			});

			// Add lockout warning to error if approaching threshold
			if (!lockStatus.isLocked && lockStatus.failedAttempts >= 3) {
				// Check if error has a response property (like AppError)
				if (error && typeof error === 'object') {
					(error as Record<string, unknown>).remainingAttempts = lockStatus.remainingAttempts;
					(error as Record<string, unknown>).lockoutWarning =
						`Account will be locked after ${lockStatus.remainingAttempts} more failed attempts`;
				}
			}

			next(error);
		}
	}

	/**
	 * GET /api/auth/me
	 * Get current authenticated user profile
	 */
	async me(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const profile = await authService.getUserProfile(authReq.user.id);

			const response: ApiResponse = {
				success: true,
				data: { user: profile },
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /api/auth/logout
	 * Logout current user: revoke the access token and end its session
	 */
	async logout(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = (req as AuthenticatedRequest).user.id;
			// authMiddleware already checked the header is "Bearer <token>".
			const token = (req.headers.authorization ?? '').replace('Bearer ', '');

			await authService.logout(token, userId);

			logger.info('User logout', { userId });

			const response: ApiResponse = {
				success: true,
				data: { message: 'Logged out successfully' },
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /api/auth/refresh
	 * Refresh access token using refresh token
	 */
	async refreshToken(req: Request, res: Response, next: NextFunction) {
		try {
			logger.info('Token refresh request received');

			const validated = refreshTokenSchema.parse(req.body);
			const result = await authService.refreshToken(validated.refreshToken);

			logger.info('Token refresh successful', { userId: result.user.id });

			const response: ApiResponse = {
				success: true,
				data: result,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.json(response);
		} catch (error) {
			logger.error('Token refresh error', { error });
			next(error);
		}
	}

	/**
	 * POST /api/auth/google
	 * Login with Google OAuth
	 */
	async googleLogin(req: Request, res: Response, next: NextFunction) {
		const ip = req.ip || req.socket.remoteAddress || 'unknown';

		try {
			logger.info('Google OAuth login request received', { ip });

			const validated = googleLoginSchema.parse(req.body);
			const result = await authService.loginWithGoogle(validated.idToken);

			const response: ApiResponse = {
				success: true,
				data: result,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			// Record OAuth failure for IP reputation tracking
			await bruteForceService.recordIPActivity(ip);

			logger.error('Google login error', { error, ip });
			next(error);
		}
	}

	/**
	 * POST /api/auth/facebook
	 * Login with Facebook OAuth
	 */
	async facebookLogin(req: Request, res: Response, next: NextFunction) {
		const ip = req.ip || req.socket.remoteAddress || 'unknown';

		try {
			logger.info('Facebook OAuth login request received', { ip });

			const validated = facebookLoginSchema.parse(req.body);
			const result = await authService.loginWithFacebook(validated.accessToken);

			const response: ApiResponse = {
				success: true,
				data: result,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			// Record OAuth failure for IP reputation tracking
			await bruteForceService.recordIPActivity(ip);

			logger.error('Facebook login error', { error, ip });
			next(error);
		}
	}

	/**
	 * GET /api/auth/providers
	 * Get list of linked authentication providers for current user
	 */
	async getLinkedProviders(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			logger.info('Get linked providers request', { userId: authReq.user.id });

			const providers = await authService.getLinkedProviders(authReq.user.id);

			const response: ApiResponse = {
				success: true,
				data: providers,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.json(response);
		} catch (error) {
			logger.error('Get linked providers error', { error });
			next(error);
		}
	}

	/**
	 * DELETE /api/auth/providers/:provider
	 * Unlink an OAuth provider from the current user's account
	 */
	async unlinkProvider(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const provider = req.params.provider as 'google' | 'facebook';

			logger.info('Unlink provider request', {
				userId: authReq.user.id,
				provider,
			});

			// Validate provider
			if (!['google', 'facebook'].includes(provider)) {
				const response: ApiResponse = {
					success: false,
					error: {
						code: 'INVALID_PROVIDER',
						message: "Invalid provider. Must be 'google' or 'facebook'",
					},
					meta: {
						timestamp: new Date().toISOString(),
					},
				};
				return res.status(400).json(response);
			}

			await authService.unlinkProvider(authReq.user.id, provider);

			const response: ApiResponse = {
				success: true,
				data: { message: `${provider} unlinked successfully` },
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.json(response);
		} catch (error) {
			logger.error('Unlink provider error', { error });
			next(error);
		}
	}

	/**
	 * POST /api/auth/providers/:provider/link
	 * Link a Google or Facebook account to the current user's account
	 */
	async linkProvider(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const { provider } = providerParamSchema.parse(req.params);
			const token =
				provider === 'google'
					? googleLoginSchema.parse(req.body).idToken
					: facebookLoginSchema.parse(req.body).accessToken;

			logger.info('Link provider request', { userId: authReq.user.id, provider });

			const result = await authService.linkProvider(authReq.user.id, provider, token);

			const response: ApiResponse = {
				success: true,
				data: result,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.json(response);
		} catch (error) {
			logger.error('Link provider error', { error });
			next(error);
		}
	}

	/**
	 * POST /api/auth/verify-email
	 * Verify email with 6-digit code
	 */
	async verifyEmail(req: Request, res: Response, next: NextFunction) {
		try {
			const validated = verifyEmailSchema.parse(req.body);
			const ip = req.ip || req.socket.remoteAddress || 'unknown';

			logger.info('Email verification attempt', {
				userId: validated.userId,
				ip,
			});

			const verificationService = new EmailVerificationService();
			await verificationService.verifyCode(validated.userId, validated.code, ip);

			// Fetch user email for session creation
			const { data: profile, error: profileError } = await supabase
				.from('user_profiles')
				.select('*, id')
				.eq('id', validated.userId)
				.single();

			if (profileError || !profile) {
				throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
			}

			// Get user from Supabase Auth
			const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
				validated.userId
			);

			if (authError || !authUser.user) {
				throw new AppError(404, 'Auth user not found', 'AUTH_USER_NOT_FOUND');
			}

			// Generate session using Admin Magic Link API
			const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
				type: 'magiclink',
				email: authUser.user.email!,
			});

			if (linkError || !linkData) {
				throw new AppError(500, 'Failed to generate session', 'SESSION_GENERATION_FAILED');
			}

			const { hashed_token } = linkData.properties;
			if (!hashed_token) {
				throw new AppError(500, 'Invalid session response', 'INVALID_SESSION_RESPONSE');
			}

			// Verify the token hash to obtain session
			const { data: verifyData, error: verifyError } = await createSignInClient().auth.verifyOtp({
				token_hash: hashed_token,
				type: 'email',
			});

			if (verifyError || !verifyData.session) {
				throw new AppError(500, 'Failed to create session', 'SESSION_CREATION_FAILED');
			}

			logger.info('Email verified successfully', { userId: validated.userId });

			const response: ApiResponse = {
				success: true,
				data: {
					user: {
						id: profile.id,
						email: authUser.user.email!,
						username: profile.username,
						displayName: profile.display_name ?? undefined,
						avatarUrl: profile.avatar_url ?? undefined,
						bio: profile.bio ?? undefined,
						createdAt: profile.created_at ?? new Date().toISOString(),
						updatedAt: profile.updated_at ?? new Date().toISOString(),
					},
					session: {
						accessToken: verifyData.session.access_token,
						refreshToken: verifyData.session.refresh_token,
						expiresIn: verifyData.session.expires_in || 3600,
						expiresAt: verifyData.session.expires_at || 0,
					},
					message: 'Email verified successfully',
				},
				meta: { timestamp: new Date().toISOString() },
			};

			res.json(response);
		} catch (error) {
			logger.error('Email verification error', { error });
			next(error);
		}
	}

	/**
	 * POST /api/auth/resend-verification
	 * Resend verification code
	 */
	async resendVerification(req: Request, res: Response, next: NextFunction) {
		try {
			const validated = resendVerificationSchema.parse(req.body);
			const ip = req.ip || req.socket.remoteAddress || 'unknown';

			logger.info('Resend verification request', {
				userId: validated.userId,
				ip,
			});

			// Same answer whether or not a code was sent: no account enumeration (#188).
			const response: ApiResponse = {
				success: true,
				data: {
					message: 'Verification code sent. Please check your email.',
				},
				meta: { timestamp: new Date().toISOString() },
			};

			const verificationService = new EmailVerificationService();

			// Cooldown first, and counted on every path past it: a matching email
			// must not be told apart by a 429 that other emails never get (#188).
			const { canResend, remainingSeconds } = await verificationService.canResendCode(
				validated.userId,
				ip
			);

			if (!canResend) {
				throw new AppError(
					429,
					`Please wait ${remainingSeconds} seconds before requesting a new code`,
					'RESEND_COOLDOWN'
				);
			}

			await verificationService.recordResendAttempt(validated.userId, ip);

			// The recipient comes from the stored account, never from the request body.
			const recipient = await this.resolveVerificationRecipient(
				validated.userId,
				validated.email
			);
			if (!recipient) {
				res.json(response);
				return;
			}

			const code = await verificationService.generateAndStore(validated.userId);
			await verificationService.sendVerificationEmail(recipient, code);

			logger.info('Verification code resent', { userId: validated.userId });

			res.json(response);
		} catch (error) {
			logger.error('Resend verification error', { error });
			next(error);
		}
	}

	/**
	 * Auth email of an unverified account whose address matches `claimedEmail`
	 * (case-insensitive), or null when no code may be sent. Fails closed: any
	 * lookup error returns null.
	 */
	private async resolveVerificationRecipient(
		userId: string,
		claimedEmail: string
	): Promise<string | null> {
		const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
		if (authError) {
			if (authError.status === 404) {
				logger.info('Resend verification: no such account', { userId });
			} else {
				logger.warn('Resend verification: account lookup failed', { userId, error: authError });
			}
			return null;
		}
		const accountEmail = authUser.user?.email;
		if (!accountEmail) {
			logger.info('Resend verification: account has no email', { userId });
			return null;
		}

		const { data: profile, error: profileError } = await supabase
			.from('user_profiles')
			.select('email_verified')
			.eq('id', userId)
			.maybeSingle();
		if (profileError || !profile) {
			logger.warn('Resend verification: profile lookup failed', {
				userId,
				error: profileError,
			});
			return null;
		}
		if (profile.email_verified) {
			logger.info('Resend verification: account already verified', { userId });
			return null;
		}

		if (accountEmail.toLowerCase() !== claimedEmail.trim().toLowerCase()) {
			logger.warn('Resend verification: email does not match the account', { userId });
			return null;
		}

		return accountEmail;
	}

	/**
	 * POST /api/auth/forgot-password
	 * Request password reset (send email with code)
	 */
	async forgotPassword(req: Request, res: Response, next: NextFunction) {
		try {
			const validated = forgotPasswordSchema.parse(req.body);
			const ip = req.ip || req.socket.remoteAddress || 'unknown';

			logger.info('Forgot password request', {
				email: validated.email,
				ip,
			});

			const passwordResetService = new PasswordResetService();
			await passwordResetService.requestPasswordReset(validated.email, ip);

			// Always return success (prevent email enumeration)
			const response: ApiResponse = {
				success: true,
				data: {
					message: 'If this email exists, a reset code has been sent.',
				},
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.json(response);
		} catch (error) {
			logger.error('Forgot password error', { error });
			next(error);
		}
	}

	/**
	 * POST /api/auth/reset-password
	 * Reset password with code
	 */
	async resetPassword(req: Request, res: Response, next: NextFunction) {
		try {
			const validated = resetPasswordSchema.parse(req.body);
			const ip = req.ip || req.socket.remoteAddress || 'unknown';

			logger.info('Reset password request', {
				email: validated.email,
				ip,
			});

			const passwordResetService = new PasswordResetService();
			await passwordResetService.resetPassword(
				validated.email,
				validated.code,
				validated.newPassword,
				ip
			);

			logger.info('Password reset successful', { email: validated.email });

			const response: ApiResponse = {
				success: true,
				data: {
					message: 'Password reset successful. You can now log in with your new password.',
				},
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.json(response);
		} catch (error) {
			logger.error('Reset password error', { error });
			next(error);
		}
	}

	/**
	 * GET /api/auth/reset-password/can-resend
	 * Check if user can resend reset code
	 */
	async canResendResetCode(req: Request, res: Response, next: NextFunction) {
		try {
			const { email } = req.query;
			const ip = req.ip || req.socket.remoteAddress || 'unknown';

			if (!email || typeof email !== 'string') {
				throw new AppError(400, 'Email is required', 'EMAIL_REQUIRED');
			}

			logger.info('Check resend reset code', { email, ip });

			const passwordResetService = new PasswordResetService();
			const result = await passwordResetService.canResendCode(email, ip);

			const response: ApiResponse = {
				success: true,
				data: result,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.json(response);
		} catch (error) {
			logger.error('Can resend reset code error', { error });
			next(error);
		}
	}
}
