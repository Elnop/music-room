import type {
	ProfilePrivacy,
	UpdatePrivacyData,
	MusicPreferences,
	UpdateMusicPreferencesData,
	MusicGenre,
	FilteredProfile,
} from '@/types/user.types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Standard API Response format (matches backend)
 */
interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: {
		message: string;
		code: string;
		details?: unknown;
	};
	meta: {
		timestamp: string;
	};
}

/**
 * API Error class
 */
export class ApiError extends Error {
	code: string;
	details?: unknown;

	constructor(message: string, code: string, details?: unknown) {
		super(message);
		this.name = 'ApiError';
		this.code = code;
		this.details = details;
	}
}

/**
 * Make API request with error handling
 */
async function apiRequest<T>(
	endpoint: string,
	accessToken: string,
	options: RequestInit = {}
): Promise<T> {
	const url = `${API_URL}${endpoint}`;

	try {
		const response = await fetch(url, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
				...options.headers,
			},
		});

		const data: ApiResponse<T> = await response.json();

		if (!data.success || data.error) {
			throw new ApiError(
				data.error?.message || 'API request failed',
				data.error?.code || 'UNKNOWN_ERROR',
				data.error?.details
			);
		}

		if (!data.data) {
			throw new ApiError('No data in response', 'NO_DATA');
		}

		return data.data;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}

		// Network or parsing errors
		if (error instanceof Error) {
			throw new ApiError(error.message, 'NETWORK_ERROR');
		}

		throw new ApiError('Unknown error occurred', 'UNKNOWN_ERROR');
	}
}

/**
 * Privacy API
 */
export const privacyApi = {
	/**
	 * Get current user's privacy settings
	 */
	async getPrivacySettings(accessToken: string): Promise<ProfilePrivacy> {
		return apiRequest<ProfilePrivacy>('/api/profile/privacy', accessToken, {
			method: 'GET',
		});
	},

	/**
	 * Update current user's privacy settings
	 */
	async updatePrivacySettings(
		accessToken: string,
		data: UpdatePrivacyData
	): Promise<ProfilePrivacy> {
		return apiRequest<ProfilePrivacy>('/api/profile/privacy', accessToken, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	},

	/**
	 * Get current user's music preferences
	 */
	async getMusicPreferences(accessToken: string): Promise<MusicPreferences> {
		return apiRequest<MusicPreferences>('/api/profile/music-preferences', accessToken, {
			method: 'GET',
		});
	},

	/**
	 * Update current user's music preferences
	 */
	async updateMusicPreferences(
		accessToken: string,
		data: UpdateMusicPreferencesData
	): Promise<MusicPreferences> {
		return apiRequest<MusicPreferences>('/api/profile/music-preferences', accessToken, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	},

	/**
	 * Get all available music genres
	 */
	async getAvailableGenres(accessToken: string): Promise<{ genres: MusicGenre[] }> {
		return apiRequest<{ genres: MusicGenre[] }>(
			'/api/profile/music-preferences/genres',
			accessToken,
			{
				method: 'GET',
			}
		);
	},

	/**
	 * Get user profile with privacy filtering applied
	 */
	async getFilteredProfile(accessToken: string, userId: string): Promise<FilteredProfile> {
		return apiRequest<FilteredProfile>(`/api/profile/${userId}`, accessToken, {
			method: 'GET',
		});
	},
};
