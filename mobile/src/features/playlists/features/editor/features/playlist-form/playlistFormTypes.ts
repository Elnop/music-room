import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CappedField } from '@/shared/theme/types/cappedFieldTypes';
import type { PlaylistInput } from '@/features/playlists/features/editor/shared/playlist-mutations/types/playlistFormTypes';
import type {
	Playlist,
	PlaylistStackParamList,
} from '@/features/playlists/shared/playlist/playlistTypes';

export type PlaylistFormNavigation = NativeStackNavigationProp<
	PlaylistStackParamList,
	'CreatePlaylist'
>;

export type PlaylistSettings = {
	isPrivate: boolean;
	setIsPrivate: (value: boolean) => void;
	isEditRestricted: boolean;
	setIsEditRestricted: (value: boolean) => void;
};

export type PlaylistForm = PlaylistSettings & {
	isEditing: boolean;
	name: CappedField;
	description: CappedField;
	submit: () => void;
	isSubmitting: boolean;
};

export type PlaylistEdit = {
	id: string;
	navigation: PlaylistFormNavigation;
	save: (variables: { id: string; changes: Partial<PlaylistInput> }) => Promise<Playlist>;
};

export type PlaylistCreation = {
	navigation: PlaylistFormNavigation;
	create: (input: PlaylistInput) => Promise<Playlist>;
	settings: Pick<PlaylistSettings, 'isPrivate' | 'isEditRestricted'>;
};
