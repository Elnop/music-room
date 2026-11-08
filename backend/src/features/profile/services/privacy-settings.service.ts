import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { Tables, TablesInsert, TablesUpdate } from '@/shared/types/supabase.generated.js';
import type { UpdatePrivacyInput } from '@/features/profile/profile.validators.js';
import type { ProfilePrivacy } from '@/features/profile/profile.types.js';

type ProfilePrivacyRow = Tables<'profile_privacy'>;

const DEFAULT_VISIBILITY = {
	emailVisibility: 'private',
	bioVisibility: 'public',
	avatarVisibility: 'public',
	musicPreferencesVisibility: 'public',
} as const;

function mapRowToPrivacy(row: ProfilePrivacyRow): ProfilePrivacy {
	return {
		userId: row.user_id,
		emailVisibility: row.email_visibility ?? DEFAULT_VISIBILITY.emailVisibility,
		bioVisibility: row.bio_visibility ?? DEFAULT_VISIBILITY.bioVisibility,
		avatarVisibility: row.avatar_visibility ?? DEFAULT_VISIBILITY.avatarVisibility,
		musicPreferencesVisibility:
			row.music_preferences_visibility ?? DEFAULT_VISIBILITY.musicPreferencesVisibility,
		createdAt: row.created_at ?? new Date().toISOString(),
		updatedAt: row.updated_at ?? new Date().toISOString(),
	};
}

function defaultPrivacySettings(userId: string): ProfilePrivacy {
	return {
		userId,
		...DEFAULT_VISIBILITY,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
}

async function createDefaultSettings(
	userId: string,
	initialData?: UpdatePrivacyInput
): Promise<ProfilePrivacy> {
	try {
		const insertData: TablesInsert<'profile_privacy'> = {
			user_id: userId,
			email_visibility: initialData?.emailVisibility ?? DEFAULT_VISIBILITY.emailVisibility,
			bio_visibility: initialData?.bioVisibility ?? DEFAULT_VISIBILITY.bioVisibility,
			avatar_visibility: initialData?.avatarVisibility ?? DEFAULT_VISIBILITY.avatarVisibility,
			music_preferences_visibility:
				initialData?.musicPreferencesVisibility ?? DEFAULT_VISIBILITY.musicPreferencesVisibility,
		};

		const { data, error } = await supabaseAdmin
			.from('profile_privacy')
			.insert(insertData)
			.select('*')
			.single();

		if (error) {
			logger.error('Failed to create default privacy settings', { error });
			throw new AppError(500, 'Failed to create privacy settings', 'PRIVACY_CREATE_ERROR');
		}

		return mapRowToPrivacy(data);
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Unexpected error creating privacy settings', { error });
		throw new AppError(500, 'Failed to create privacy settings', 'PRIVACY_CREATE_ERROR');
	}
}

export async function getPrivacySettings(
	userId: string,
	requesterId?: string
): Promise<ProfilePrivacy> {
	try {
		logger.info('Fetching privacy settings', { userId, requesterId });

		const { data, error } = await supabaseAdmin
			.from('profile_privacy')
			.select('*')
			.eq('user_id', userId)
			.single();

		if (error) {
			if (error.code === 'PGRST116') {
				if (requesterId === userId) return await createDefaultSettings(userId);
				return defaultPrivacySettings(userId);
			}
			logger.error('Failed to fetch privacy settings', { error });
			throw new AppError(500, 'Failed to fetch privacy settings', 'PRIVACY_FETCH_ERROR');
		}

		return mapRowToPrivacy(data);
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Unexpected error fetching privacy settings', { error });
		throw new AppError(500, 'Failed to fetch privacy settings', 'PRIVACY_FETCH_ERROR');
	}
}

export async function updatePrivacySettings(
	userId: string,
	data: UpdatePrivacyInput
): Promise<ProfilePrivacy> {
	try {
		logger.info('Updating privacy settings', { userId, data });

		const updateData: TablesUpdate<'profile_privacy'> = { updated_at: new Date().toISOString() };
		if (data.emailVisibility !== undefined) updateData.email_visibility = data.emailVisibility;
		if (data.bioVisibility !== undefined) updateData.bio_visibility = data.bioVisibility;
		if (data.avatarVisibility !== undefined) updateData.avatar_visibility = data.avatarVisibility;
		if (data.musicPreferencesVisibility !== undefined) {
			updateData.music_preferences_visibility = data.musicPreferencesVisibility;
		}

		const { data: updatedData, error } = await supabaseAdmin
			.from('profile_privacy')
			.update(updateData)
			.eq('user_id', userId)
			.select('*')
			.single();

		if (error) {
			if (error.code === 'PGRST116') return await createDefaultSettings(userId, data);
			logger.error('Failed to update privacy settings', { error });
			throw new AppError(500, 'Failed to update privacy settings', 'PRIVACY_UPDATE_ERROR');
		}

		logger.info('Privacy settings updated successfully', { userId });
		return mapRowToPrivacy(updatedData);
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Unexpected error updating privacy settings', { error });
		throw new AppError(500, 'Failed to update privacy settings', 'PRIVACY_UPDATE_ERROR');
	}
}
