import { Router } from 'express';
import * as session from '@/features/auth/auth.controller.js';
import * as oauth from '@/features/auth/auth-oauth.controller.js';
import * as email from '@/features/auth/auth-email.controller.js';
import * as password from '@/features/auth/auth-password.controller.js';
import { authMiddleware } from '@/features/auth/auth.middleware.js';
import {
	loginRateLimiter,
	registerRateLimiter,
	oauthRateLimiter,
	globalAuthRateLimiter,
} from '@/shared/security/http-rate-limit.js';
import {
	checkAccountLockout,
	checkIPBlacklist,
} from '@/shared/security/account-lockout.middleware.js';

const router = Router();

// IP blacklist first, then the global rate limiter as a safety net.
router.use(checkIPBlacklist);
router.use(globalAuthRateLimiter);

router.post('/register', registerRateLimiter, session.register);
router.post('/login', loginRateLimiter, checkAccountLockout, session.login);
router.post('/refresh', loginRateLimiter, session.refreshToken);
router.get('/me', authMiddleware, session.me);
router.post('/logout', authMiddleware, session.logout);

router.post('/google', oauthRateLimiter, oauth.googleLogin);
router.post('/facebook', oauthRateLimiter, oauth.facebookLogin);
router.get('/providers', authMiddleware, oauth.getLinkedProviders);
router.delete('/providers/:provider', authMiddleware, oauth.unlinkProvider);
router.post('/providers/:provider/link', authMiddleware, oauthRateLimiter, oauth.linkProvider);

router.post('/verify-email', loginRateLimiter, email.verifyEmail);
router.post('/resend-verification', registerRateLimiter, email.resendVerification);

router.post('/forgot-password', globalAuthRateLimiter, password.forgotPassword);
router.post('/reset-password', globalAuthRateLimiter, password.resetPassword);
router.get('/reset-password/can-resend', globalAuthRateLimiter, password.canResendResetCode);

export default router;
