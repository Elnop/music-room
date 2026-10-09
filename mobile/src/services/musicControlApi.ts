import { getBackendUrl } from '@/services/backendUrl';
import type { ApiResponse } from '@/types/api.types';
import { useAuthStore } from '@/store/authStore';

export interface MusicControlPermissionsResponse {
	allowedUserIds: string[];
}

export interface CanControlResponse {
	canControl: boolean;
	targetUserId: string;
}

export interface ControlActionResponse {
	success: boolean;
	allowedUserId: string;
}

const getAuthToken = async (): Promise<string> => {
	const token = useAuthStore.getState().accessToken;
	if (!token) throw new Error('No authentication token available');
	return token;
};

/**
 * Music Control API
 * Manages music control permissions between friends
 */
export const musicControlApi = {
	/**
	 * Get list of users that I have granted control to
	 */
	async getMyPermissions(): Promise<string[]> {
		const token = await getAuthToken();
		const response = await fetch(`${getBackendUrl()}/api/music-control/permissions`, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to get permissions');
		}

		const data: ApiResponse<MusicControlPermissionsResponse> = await response.json();
		return data.data!.allowedUserIds;
	},

	/**
	 * Grant control permission to a friend
	 */
	async grantControl(userId: string): Promise<void> {
		const token = await getAuthToken();
		const response = await fetch(`${getBackendUrl()}/api/music-control/permissions/${userId}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to grant control');
		}
	},

	/**
	 * Revoke control permission from a user
	 */
	async revokeControl(userId: string): Promise<void> {
		const token = await getAuthToken();
		const response = await fetch(`${getBackendUrl()}/api/music-control/permissions/${userId}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to revoke control');
		}
	},

	/**
	 * Check if a user has granted me control
	 */
	async canControl(userId: string): Promise<boolean> {
		const token = await getAuthToken();
		const response = await fetch(`${getBackendUrl()}/api/music-control/can-control/${userId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			// If error, assume no control
			return false;
		}

		const data: ApiResponse<CanControlResponse> = await response.json();
		return data.data!.canControl;
	},
};
