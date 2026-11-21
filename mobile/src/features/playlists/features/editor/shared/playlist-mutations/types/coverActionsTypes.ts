import type { QueryClient } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/playlistTypes';

export type CoverNavigation = Pick<NativeStackNavigationProp<PlaylistStackParamList>, 'getParent'>;

export type CoverTask = {
	run: () => Promise<string | null>;
	done: string;
	fallback: string;
};

export type CoverContext = {
	client: QueryClient;
	playlistId: string;
	navigation: CoverNavigation;
	refetchPlan: () => void;
};

export type CoverActions = {
	isPremium: boolean;
	isUploading: boolean;
	change: () => void;
	remove: () => void;
};
