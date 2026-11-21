import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type {
	PlaylistStackParamList,
	PlaylistWithTracks,
} from '@/features/playlists/shared/playlist/playlistTypes';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';

export type DetailNavigation = NativeStackNavigationProp<PlaylistStackParamList, 'PlaylistDetail'>;

export type LoadFailure = 'notFound' | 'error' | null;

export type PlaylistDetailScreen = {
	id: string;
	playlist: PlaylistWithTracks | undefined;
	failure: LoadFailure;
	retry: () => void;
	isRefreshing: boolean;
	refresh: () => void;
	markDeleting: (deleting: boolean) => void;
	leaveDeleted: () => void;
	bottomPadding: number;
};

export type DeletedPlaylist = {
	active: boolean;
	markDeleting: (deleting: boolean) => void;
	leaveDeleted: () => void;
};

export type OwnerActions = {
	isOwner: boolean;
	sheetVisible: boolean;
	sheetAnchor: MenuAnchor | null;
	openSheet: () => void;
	closeSheet: () => void;
	edit: () => void;
	sharing: () => void;
	remove: () => void;
};
