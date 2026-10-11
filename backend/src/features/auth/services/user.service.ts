import { supabase, createSignInClient } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { UserProfile, UserProfileRow } from '@/features/auth/auth.types.js';
import type { Session } from '@supabase/supabase-js';
import { providerIdField } from '@/features/auth/utils/auth.helpers.js';

// user_profiles.username CHECK (001_initial_schema.sql), as in auth.validators.ts
const USERNAME_MAX_LENGTH = 20;

function withSuffix(username: string, suffix: string): string {
	return `${username.slice(0, USERNAME_MAX_LENGTH - suffix.length)}${suffix}`;
}

export class UserService {
	/**
	 * Generate unique username from base name
	 * @param baseName - Base name to generate username from (e.g., "John Doe")
	 * @returns Unique username (e.g., "johndoe" or "johndoe1"), at most
	 * USERNAME_MAX_LENGTH characters: the base is cut to leave room for a suffix
	 */
	private static async generateUniqueUsername(baseName: string): Promise<string> {
		let username = baseName
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '')
			.slice(0, USERNAME_MAX_LENGTH);

		if (username.length < 3) {
			username = `user${Date.now()}`;
		}

		const { data: existing } = await supabase
			.from('user_profiles')
			.select('username')
			.eq('username', username)
			.single();

		if (!existing) {
			return username;
		}

		for (let i = 1; i <= 999; i++) {
			const candidate = withSuffix(username, String(i));
			const { data } = await supabase
				.from('user_profiles')
				.select('username')
				.eq('username', candidate)
				.single();

			if (!data) {
				return candidate;
			}
		}

		return withSuffix(username, String(Date.now()));
	}

	/**
	 * Create session for OAuth user using Admin Magic Link API
	 * This method does NOT modify user passwords - safe for all user types
	 * @param email - User email
	 * @returns Supabase session with access and refresh tokens
	 */
	private static async createSessionForOAuthUser(email: string): Promise<Session> {
		try {
			const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
				type: 'magiclink',
				email,
			});

			if (linkError || !linkData) {
				logger.error('Failed to generate magic link for OAuth user', {
					email,
					error: linkError,
				});
				throw new AppError(
					500,
					'Failed to generate session link',
					'SESSION_LINK_GENERATION_FAILED'
				);
			}

			const { hashed_token } = linkData.properties;

			if (!hashed_token) {
				logger.error('Magic link response missing hashed_token', {
					email,
					properties: linkData.properties,
				});
				throw new AppError(500, 'Invalid magic link response', 'INVALID_MAGIC_LINK_RESPONSE');
			}

			const { data: verifyData, error: verifyError } = await createSignInClient().auth.verifyOtp({
				token_hash: hashed_token,
				type: 'email',
			});

			if (verifyError || !verifyData.session) {
				logger.error('Failed to verify OTP and create session', {
					email,
					error: verifyError,
				});
				throw new AppError(
					500,
					'Failed to create session from magic link',
					'SESSION_VERIFICATION_FAILED'
				);
			}

			return verifyData.session;
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}
			logger.error('Unexpected error creating OAuth session', {
				email,
				error,
			});
			throw new AppError(500, 'Failed to create OAuth session', 'OAUTH_SESSION_ERROR');
		}
	}

	/**
	 * Create or retrieve OAuth user
	 * @param provider - OAuth provider ('google' | 'facebook')
	 * @param providerId - Provider-specific user ID (Google sub claim, Facebook user ID)
	 * @param email - User email (optional - will generate synthetic email if missing)
	 * @param profile - OAuth profile data
	 * @returns User profile and session
	 */
	static async createOAuthUser(
		provider: 'google' | 'facebook',
		providerId: string,
		email: string | undefined,
		profile: { name: string; picture?: string | { data: { url: string } } }
	): Promise<{ userProfile: UserProfile; session: Session }> {
		try {
			const providerColumn = `${provider}_id`;

			const effectiveEmail = email || `${provider}_${providerId}@zumik.local`;

			if (!email) {
				logger.info('Using synthetic email for OAuth user', {
					provider,
					providerId,
					syntheticEmail: effectiveEmail,
				});
			}

			const { data: existingOAuth } = await supabase
				.from('user_profiles')
				.select('*')
				.eq(providerColumn, providerId)
				.single();

			if (existingOAuth) {
				if (!existingOAuth.email_verified) {
					await supabase
						.from('user_profiles')
						.update({ email_verified: true })
						.eq('id', existingOAuth.id);
				}

				// The provider may have been linked with another email: open the
				// session for the account's own auth email, not the network's.
				const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(
					existingOAuth.id
				);
				const accountEmail = authUser?.user?.email;

				if (authUserError || !accountEmail) {
					logger.error('Failed to get auth user for OAuth login', {
						userId: existingOAuth.id,
						error: authUserError,
					});
					throw new AppError(500, 'Failed to load OAuth user', 'OAUTH_USER_LOOKUP_FAILED');
				}

				const session = await this.createSessionForOAuthUser(accountEmail);

				return {
					userProfile: {
						id: existingOAuth.id,
						email: accountEmail,
						username: existingOAuth.username,
						displayName: existingOAuth.display_name ?? undefined,
						avatarUrl: existingOAuth.avatar_url ?? undefined,
						bio: existingOAuth.bio ?? undefined,
						createdAt: existingOAuth.created_at ?? new Date().toISOString(),
						updatedAt: existingOAuth.updated_at ?? new Date().toISOString(),
					},
					session,
				};
			}

			let existingUser = null;

			if (email) {
				let page = 1;
				const perPage = 100;

				while (!existingUser) {
					const { data: pageData, error: listError } = await supabase.auth.admin.listUsers({
						page,
						perPage,
					});

					if (listError) {
						logger.error('Failed to list users from Supabase auth', {
							error: listError,
						});
						break;
					}

					const users = pageData?.users ?? [];
					if (users.length === 0) {
						break;
					}

					existingUser = users.find(u => u.email === email) ?? null;
					if (existingUser) {
						break;
					}

					page += 1;
				}
			}

			if (existingUser) {
				const { data: existingProfile } = await supabase
					.from('user_profiles')
					.select('*')
					.eq('id', existingUser.id)
					.single();

				if (existingProfile) {
					const providerValue = existingProfile[providerColumn as keyof UserProfileRow];
					if (providerValue) {
						const session = await this.createSessionForOAuthUser(effectiveEmail);
						return {
							userProfile: {
								id: existingProfile.id,
								email: effectiveEmail,
								username: existingProfile.username,
								displayName: existingProfile.display_name ?? undefined,
								avatarUrl: existingProfile.avatar_url ?? undefined,
								bio: existingProfile.bio ?? undefined,
								createdAt: existingProfile.created_at ?? new Date().toISOString(),
								updatedAt: existingProfile.updated_at ?? new Date().toISOString(),
							},
							session,
						};
					}

					const avatarUrl =
						typeof profile.picture === 'string'
							? profile.picture
							: (profile.picture?.data?.url ?? existingProfile.avatar_url);

					const { error: updateError } = await supabase
						.from('user_profiles')
						.update({
							...providerIdField(provider, providerId),
							avatar_url: avatarUrl || existingProfile.avatar_url || null,
							email_verified: true,
							updated_at: new Date().toISOString(),
						})
						.eq('id', existingProfile.id);

					if (updateError) {
						logger.error('Failed to update profile with OAuth provider', {
							error: updateError,
						});
					}

					const session = await this.createSessionForOAuthUser(effectiveEmail);

					return {
						userProfile: {
							id: existingProfile.id,
							email: effectiveEmail,
							username: existingProfile.username,
							displayName: existingProfile.display_name ?? undefined,
							avatarUrl: existingProfile.avatar_url ?? undefined,
							bio: existingProfile.bio ?? undefined,
							createdAt: existingProfile.created_at ?? new Date().toISOString(),
							updatedAt: existingProfile.updated_at ?? new Date().toISOString(),
						},
						session,
					};
				}
			}

			const username = await this.generateUniqueUsername(
				profile.name || effectiveEmail.split('@')[0]
			);

			const { data: authData, error: authError } = await supabase.auth.admin.createUser({
				email: effectiveEmail,
				email_confirm: true,
				user_metadata: {
					oauth_provider: provider,
					oauth_provider_id: providerId,
					display_name: profile.name,
					avatar_url: profile.picture || null,
					is_synthetic_email: !email,
				},
			});

			if (authError || !authData.user) {
				logger.error('Failed to create OAuth auth user', {
					error: authError,
				});
				throw new AppError(500, 'Failed to create user', 'USER_CREATION_FAILED');
			}

			try {
				const avatarUrlValue =
					typeof profile.picture === 'string'
						? profile.picture
						: (profile.picture?.data?.url ?? null);

				const { data: userProfile, error: profileError } = await supabase
					.from('user_profiles')
					.insert({
						id: authData.user.id,
						username,
						display_name: profile.name || username,
						avatar_url: avatarUrlValue,
						...providerIdField(provider, providerId),
						email_verified: true,
						// Signed up with Google or Facebook: no password until one is set (#189).
						has_password: false,
					})
					.select()
					.single();

				if (profileError) {
					if (profileError.code === '23505') {
						await supabase.auth.admin.deleteUser(authData.user.id);
						return this.createOAuthUser(provider, providerId, email, profile);
					}

					logger.error('Failed to create user profile', {
						error: profileError,
					});
					await supabase.auth.admin.deleteUser(authData.user.id);
					throw new AppError(500, 'Failed to create profile', 'PROFILE_CREATION_FAILED');
				}

				if (!userProfile) {
					throw new AppError(500, 'Profile creation returned no data', 'PROFILE_CREATION_FAILED');
				}

				const session = await this.createSessionForOAuthUser(effectiveEmail);

				return {
					userProfile: {
						id: userProfile.id,
						email: effectiveEmail,
						username: userProfile.username,
						displayName: userProfile.display_name ?? undefined,
						avatarUrl: userProfile.avatar_url ?? undefined,
						bio: userProfile.bio ?? undefined,
						createdAt: userProfile.created_at ?? new Date().toISOString(),
						updatedAt: userProfile.updated_at ?? new Date().toISOString(),
					},
					session,
				};
			} catch (error) {
				await supabase.auth.admin.deleteUser(authData.user.id);
				throw error;
			}
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}
			logger.error('Unexpected error during OAuth user creation', { error });
			throw new AppError(500, 'Failed to create OAuth user', 'OAUTH_USER_CREATION_ERROR');
		}
	}
}
