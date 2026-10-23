import type { Request, Response } from 'express';
import {
	googleLoginSchema,
	facebookLoginSchema,
	providerParamSchema,
} from '@/features/auth/auth.validators.js';
import type { OAuthProvider } from '@/features/auth/auth.types.js';
import * as oauthLoginService from '@/features/auth/services/oauth-login.service.js';
import * as providerService from '@/features/auth/services/provider.service.js';
import * as providerLinkService from '@/features/auth/services/provider-link.service.js';
import { requestIp } from '@/shared/security/request-ip.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { sendSuccess } from '@/shared/utils/send-success.js';
import * as ipReputation from '@/shared/security/ip-reputation.js';

/** A failure counts toward the IP reputation. */
async function oauthLogin(req: Request, res: Response, signIn: () => Promise<unknown>) {
	const ip = requestIp(req);
	try {
		sendSuccess(res, await signIn());
	} catch (error) {
		await ipReputation.recordIPActivity(ip);
		logger.warn('OAuth login failed', { path: req.path, ip });
		throw error;
	}
}

export async function googleLogin(req: Request, res: Response) {
	await oauthLogin(req, res, () =>
		oauthLoginService.loginWithGoogle(googleLoginSchema.parse(req.body).idToken)
	);
}

export async function facebookLogin(req: Request, res: Response) {
	await oauthLogin(req, res, () =>
		oauthLoginService.loginWithFacebook(facebookLoginSchema.parse(req.body).accessToken)
	);
}

export async function getLinkedProviders(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	sendSuccess(res, await providerService.getLinkedProviders(userId));
}

export async function unlinkProvider(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const provider = req.params.provider as OAuthProvider;

	// Checked by hand, not by providerParamSchema: this route answers INVALID_PROVIDER.
	if (!['google', 'facebook'].includes(provider)) {
		throw new AppError(400, "Invalid provider. Must be 'google' or 'facebook'", 'INVALID_PROVIDER');
	}

	await providerService.unlinkProvider(userId, provider);
	sendSuccess(res, { message: `${provider} unlinked successfully` });
}

export async function linkProvider(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const { provider } = providerParamSchema.parse(req.params);
	const token =
		provider === 'google'
			? googleLoginSchema.parse(req.body).idToken
			: facebookLoginSchema.parse(req.body).accessToken;

	logger.info('Link provider request', { userId, provider });
	sendSuccess(res, await providerLinkService.linkProvider(userId, provider, token));
}
