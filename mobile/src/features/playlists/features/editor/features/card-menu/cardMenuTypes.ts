import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type {
	Playlist,
	PlaylistStackParamList,
} from '@/features/playlists/shared/playlist/playlistTypes';
import type { PlaylistActionsMenu } from '@/features/playlists/features/editor/shared/action-sheet/actionSheetTypes';

export type CardMenuNavigation = Pick<
	NativeStackNavigationProp<PlaylistStackParamList>,
	'navigate' | 'getParent'
>;

export type CardMenuSelection = {
	visible: boolean;
	playlist: Playlist | null;
	actionsFor: (playlist: Playlist) => (() => void) | undefined;
	close: () => void;
};

export type PlaylistCardMenu = Omit<CardMenuSelection, 'playlist'> & {
	sheet: PlaylistActionsMenu | null;
};
