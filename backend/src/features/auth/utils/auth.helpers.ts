import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type {
	AuthResponse,
	OAuthProvider,
	UserProfile,
	UserProfileRow,
} from '@/features/auth/auth.types.js';
import type { User, Session } from '@supabase/supabase-js';

type ProfileFields = Pick<
	UserProfileRow,
	'id' | 'username' | 'display_name' | 'avatar_url' | 'bio' | 'created_at' | 'updated_at'
>;

/** Typed object to spread into an insert or update: a computed `${provider}_id` key is untyped. */
export function providerIdField(
	provider: OAuthProvider,
	providerId: string | null
): { google_id: string | null } | { facebook_id: string | null } {
	return provider === 'google' ? { google_id: providerId } : { facebook_id: providerId };
}

/** A user_profiles row and the account's email as the API's user object. */
export function toUserProfile(row: ProfileFields, email: string): UserProfile {
	return {
		id: row.id,
		email,
		username: row.username,
		displayName: row.display_name ?? undefined,
		avatarUrl: row.avatar_url ?? undefined,
		bio: row.bio ?? undefined,
		createdAt: row.created_at ?? new Date().toISOString(),
		updatedAt: row.updated_at ?? new Date().toISOString(),
	};
}

/** A session opened by a magic link (OAuth sign-in, email verification) as the API's session. */
export function toSessionBody(session: Session): NonNullable<AuthResponse['session']> {
	return {
		accessToken: session.access_token,
		refreshToken: session.refresh_token,
		expiresIn: session.expires_in || 3600,
		expiresAt: session.expires_at || 0,
	};
}

export function formatAuthResponse(
	user: User,
	session: Session,
	username: string,
	displayName?: string,
	avatarUrl?: string,
	bio?: string,
	createdAt?: string,
	updatedAt?: string
): AuthResponse {
	return {
		user: {
			id: user.id,
			email: user.email ?? '',
			username,
			displayName,
			avatarUrl,
			bio,
			createdAt: createdAt || new Date().toISOString(),
			updatedAt: updatedAt || new Date().toISOString(),
		},
		session: {
			accessToken: session.access_token,
			refreshToken: session.refresh_token,
			expiresIn: session.expires_in ?? 0,
			expiresAt: session.expires_at ?? 0,
		},
	};
}

export async function fetchUserProfile(userId: string): Promise<{
	username: string;
	display_name?: string;
	avatar_url?: string;
	bio?: string;
	created_at: string;
	updated_at: string;
}> {
	const { data: profile, error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.select('username, display_name, avatar_url, bio, created_at, updated_at')
		.eq('id', userId)
		.single();

	if (profileError || !profile) {
		logger.error('Failed to fetch user profile', {
			userId,
			error: profileError,
		});
		throw new AppError(500, 'Failed to fetch user profile', 'PROFILE_ERROR');
	}

	return {
		username: profile.username,
		display_name: profile.display_name ?? undefined,
		avatar_url: profile.avatar_url ?? undefined,
		bio: profile.bio ?? undefined,
		created_at: profile.created_at ?? new Date().toISOString(),
		updated_at: profile.updated_at ?? new Date().toISOString(),
	};
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
	try {
		const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

		if (userError || !user.user) {
			throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
		}

		const { data: profile, error: profileError } = await supabaseAdmin
			.from('user_profiles')
			.select('*')
			.eq('id', userId)
			.single();

		if (profileError || !profile) {
			throw new AppError(404, 'User profile not found', 'PROFILE_NOT_FOUND');
		}

		return toUserProfile({ ...profile, id: user.user.id }, user.user.email ?? '');
	} catch (error) {
		if (error instanceof AppError) throw error;
		throw new AppError(500, 'Failed to get user profile', 'PROFILE_ERROR');
	}
}
