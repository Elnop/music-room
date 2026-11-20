import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/lib/types';
import { usePlaylistForm } from '@/features/playlists/features/editor/features/playlist-form/usePlaylistForm';
import { PlaylistFormView } from '@/features/playlists/features/editor/features/playlist-form/components/presenters/PlaylistFormView';

type PlaylistFormOrchestratorProps = NativeStackScreenProps<
	PlaylistStackParamList,
	'CreatePlaylist'
>;

export function PlaylistFormContainer({ navigation, route }: PlaylistFormOrchestratorProps) {
	const form = usePlaylistForm(navigation, route.params?.playlistId);
	const bottomPadding = useBottomPadding();
	return <PlaylistFormView form={form} bottomPadding={bottomPadding} />;
}
