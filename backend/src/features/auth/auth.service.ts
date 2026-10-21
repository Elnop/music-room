import { supabaseAdmin, createSignInClient } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { formatAuthResponse, getUserProfile } from '@/features/auth/utils/auth.helpers.js';
import { SessionService } from '@/features/auth/services/session.service.js';
import { OAuthService } from '@/features/auth/services/oauth.service.js';
import { UserService } from '@/features/auth/services/user.service.js';
import { ProviderService } from '@/features/auth/services/provider.service.js';
import { ProviderLinkService } from '@/features/auth/services/provider-link.service.js';
import { RegistrationService } from '@/features/auth/services/registration.service.js';
import { findAuthUserIdByEmail } from '@/features/auth/utils/find-auth-user.js';
import type {
	RegisterDTO,
	LoginDTO,
	AuthResponse,
	UserProfile,
	SupabaseUser,
	LinkedProvidersResponse,
	OAuthProvider,
} from '@/features/auth/auth.types.js';

export class AuthService {
	private sessionService: SessionService;

	constructor() {
		this.sessionService = new SessionService();
	}
	/**
	 * Register a new user (see RegistrationService)
	 */
	async register(data: RegisterDTO): Promise<AuthResponse> {
		return new RegistrationService().register(data, credentials => this.login(credentials));
	}

	/**
	 * Login user with email and password
	 */
	async login(data: LoginDTO): Promise<AuthResponse> {
		try {
			logger.info('User login attempt', { email: data.email });

			const { data: authData, error: authError } =
				await createSignInClient().auth.signInWithPassword({
					email: data.email,
					password: data.password,
				});

			// register creates the auth user unconfirmed until the email code is
			// verified. Supabase checks the password first and answers
			// email_not_confirmed only to the right one, so this 403 reveals
			// nothing about which emails have an account (#243).
			if (authError?.code === 'email_not_confirmed') {
				const userId = await findAuthUserIdByEmail(data.email);
				logger.warn('Login blocked - email not verified', { userId, email: data.email });
				throw new AppError(
					403,
					'Please verify your email before logging in. Check your inbox for the verification code.',
					'EMAIL_NOT_VERIFIED',
					{ userId, email: data.email }
				);
			}

			if (authError) {
				logger.warn('Login failed - auth error', {
					email: data.email,
					error: authError.message,
				});
				throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
			}

			if (!authData.user || !authData.session) {
				logger.error('Login failed - no user or session returned');
				throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
			}

			const { data: profile, error: profileError } = await supabaseAdmin
				.from('user_profiles')
				.select('*, email_verified, google_id, facebook_id')
				.eq('id', authData.user.id)
				.single();

			if (profileError || !profile) {
				logger.error('Failed to fetch user profile', {
					userId: authData.user.id,
					error: profileError,
				});
				throw new AppError(404, 'User profile not found', 'PROFILE_NOT_FOUND');
			}

			const isOAuthAccount = profile.google_id || profile.facebook_id;
			if (!isOAuthAccount && !profile.email_verified) {
				logger.warn('Login blocked - email not verified', {
					userId: authData.user.id,
					email: authData.user.email,
				});
				throw new AppError(
					403,
					'Please verify your email before logging in. Check your inbox for the verification code.',
					'EMAIL_NOT_VERIFIED',
					{
						userId: authData.user.id,
						email: authData.user.email,
					}
				);
			}

			logger.info('User logged in successfully', {
				userId: authData.user.id,
				username: profile.username,
			});

			return formatAuthResponse(
				authData.user,
				authData.session,
				profile.username,
				profile.display_name ?? undefined,
				profile.avatar_url ?? undefined,
				profile.bio ?? undefined,
				profile.created_at ?? undefined,
				profile.updated_at ?? undefined
			);
		} catch (error) {
			if (error instanceof AppError) throw error;
			logger.error('Unexpected error during login', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new AppError(500, 'Login failed', 'LOGIN_ERROR');
		}
	}

	/**
	 * Verify JWT token and return user
	 */
	async verifyToken(token: string): Promise<SupabaseUser> {
		return this.sessionService.verifyToken(token);
	}

	/**
	 * Refresh access token using refresh token
	 */
	async refreshToken(refreshToken: string): Promise<AuthResponse> {
		return this.sessionService.refreshToken(refreshToken);
	}

	/**
	 * Revoke the access token and end its Supabase session
	 */
	async logout(token: string, userId: string): Promise<void> {
		return this.sessionService.logout(token, userId);
	}

	/**
	 * Get user profile by ID
	 */
	async getUserProfile(userId: string): Promise<UserProfile> {
		return getUserProfile(userId);
	}

	/**
	 * Login with Google OAuth
	 * @param idToken - Google ID token from mobile app
	 * @returns AuthResponse with user and session
	 */
	async loginWithGoogle(idToken: string): Promise<AuthResponse> {
		try {
			logger.info('Google OAuth login attempt');

			const googlePayload = await OAuthService.verifyGoogleToken(idToken);

			const { userProfile, session } = await UserService.createOAuthUser(
				'google',
				googlePayload.sub,
				googlePayload.email,
				{
					name: googlePayload.name || googlePayload.email.split('@')[0],
					picture: googlePayload.picture,
				}
			);

			logger.info('Google OAuth login successful', {
				userId: userProfile.id,
				username: userProfile.username,
			});

			return {
				user: {
					id: userProfile.id,
					email: userProfile.email,
					username: userProfile.username,
					displayName: userProfile.displayName,
					avatarUrl: userProfile.avatarUrl,
					bio: userProfile.bio,
					createdAt: userProfile.createdAt,
					updatedAt: userProfile.updatedAt,
				},
				session: {
					accessToken: session.access_token,
					refreshToken: session.refresh_token,
					expiresIn: session.expires_in || 3600,
					expiresAt: session.expires_at || 0,
				},
			};
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}
			logger.error('Unexpected error during Google OAuth login', { error });
			throw new AppError(500, 'Google login failed', 'GOOGLE_LOGIN_ERROR');
		}
	}

	/**
	 * Get linked authentication providers for a user
	 * @param userId - User ID
	 * @returns List of linked providers
	 */
	async getLinkedProviders(userId: string): Promise<LinkedProvidersResponse> {
		return ProviderService.getLinkedProviders(userId);
	}

	/**
	 * Login with Facebook OAuth
	 * @param accessToken - Facebook access token from mobile app
	 * @returns AuthResponse with user and session
	 */
	async loginWithFacebook(accessToken: string): Promise<AuthResponse> {
		try {
			logger.info('Facebook OAuth login attempt');

			const facebookPayload = await OAuthService.verifyFacebookToken(accessToken);

			const { userProfile, session } = await UserService.createOAuthUser(
				'facebook',
				facebookPayload.id,
				facebookPayload.email,
				{
					name: facebookPayload.name,
					picture: facebookPayload.picture,
				}
			);

			logger.info('Facebook OAuth login successful', {
				userId: userProfile.id,
				username: userProfile.username,
				hasSyntheticEmail: !facebookPayload.email,
			});

			return {
				user: {
					id: userProfile.id,
					email: userProfile.email,
					username: userProfile.username,
					displayName: userProfile.displayName,
					avatarUrl: userProfile.avatarUrl,
					bio: userProfile.bio,
					createdAt: userProfile.createdAt,
					updatedAt: userProfile.updatedAt,
				},
				session: {
					accessToken: session.access_token,
					refreshToken: session.refresh_token,
					expiresIn: session.expires_in || 3600,
					expiresAt: session.expires_at || 0,
				},
			};
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}
			logger.error('Unexpected error during Facebook OAuth login', { error });
			throw new AppError(500, 'Facebook login failed', 'FACEBOOK_LOGIN_ERROR');
		}
	}

	/**
	 * Unlink an OAuth provider from a user's account
	 * @param userId - User ID
	 * @param provider - Provider to unlink ('google' or 'facebook')
	 */
	async unlinkProvider(userId: string, provider: OAuthProvider): Promise<void> {
		return ProviderService.unlinkProvider(userId, provider);
	}

	/**
	 * Link an OAuth provider to a user's account
	 * @param userId - User ID
	 * @param provider - Provider to link ('google' or 'facebook')
	 * @param token - Google ID token or Facebook access token
	 * @returns Every linked provider afterwards
	 */
	async linkProvider(
		userId: string,
		provider: OAuthProvider,
		token: string
	): Promise<LinkedProvidersResponse> {
		return ProviderLinkService.linkProvider(userId, provider, token);
	}
}
