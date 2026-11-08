import { apiRequest } from '@/shared/services/api';
import type { UserSummary } from '@/features/playlists/types';

/** Friends: the people the user follows who follow them back. */
export function getFriends(): Promise<UserSummary[]> {
	return apiRequest<UserSummary[]>('/api/friends', { method: 'GET' });
}

export function getUserProfile(userId: string): Promise<UserSummary> {
	return apiRequest<UserSummary>(`/api/profile/${userId}`, { method: 'GET' });
}

export function searchUsers(query: string, limit = 20): Promise<UserSummary[]> {
	const params = new URLSearchParams({ q: query, limit: limit.toString() });
	return apiRequest<UserSummary[]>(`/api/profile/search?${params.toString()}`, { method: 'GET' });
}
