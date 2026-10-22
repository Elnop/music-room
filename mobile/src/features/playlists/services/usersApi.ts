import { apiRequest } from '@/shared/services/api';
import type { UserSummary } from '@/features/playlists/types';

// The user endpoints the playlist screens read: friends for their playlists,
// profiles and search for the members of a playlist.

/** The people the user follows and who follow them back. */
export function getFriends(): Promise<UserSummary[]> {
	return apiRequest<UserSummary[]>('/api/friends', { method: 'GET' });
}

/** A user's profile, as their privacy settings show it. */
export function getUserProfile(userId: string): Promise<UserSummary> {
	return apiRequest<UserSummary>(`/api/profile/${userId}`, { method: 'GET' });
}

/** Users whose username or display name matches `query`. */
export function searchUsers(query: string, limit = 20): Promise<UserSummary[]> {
	const params = new URLSearchParams({ q: query, limit: limit.toString() });
	return apiRequest<UserSummary[]>(`/api/profile/search?${params.toString()}`, { method: 'GET' });
}
