import { apiRequest, authRequest } from './api';

export interface FriendUserSummary {
	id: string;
	username: string;
	displayName?: string | null;
	avatarUrl?: string | null;
}

interface FriendsBridge {
	getFriends: (accessToken?: string) => Promise<FriendUserSummary[]>;
}

let bridge: FriendsBridge | null = null;

export function registerFriendsBridge(impl: FriendsBridge): void {
	bridge = impl;
}

export function resetFriendsBridge(): void {
	bridge = null;
}

export async function getFriends(accessToken?: string): Promise<FriendUserSummary[]> {
	if (bridge) {
		return bridge.getFriends(accessToken);
	}
	if (accessToken) {
		return authRequest<FriendUserSummary[]>('/api/friends', accessToken);
	}
	return apiRequest<FriendUserSummary[]>('/api/friends');
}
