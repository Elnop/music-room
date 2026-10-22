import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { usePlayerHeight } from '@/shared/services/playbackBridge';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { usePlaylistForm } from '@/features/playlists/form/hooks/usePlaylistForm';
import { PlaylistFormView } from '@/features/playlists/form/components/presenters/PlaylistFormView';

type PlaylistFormOrchestratorProps = NativeStackScreenProps<
	PlaylistStackParamList,
	'CreatePlaylist'
>;

/** The « Nouvelle Playlist » form, or « Modifier la playlist » with a playlistId (#342). */
export function PlaylistFormOrchestrator({ navigation, route }: PlaylistFormOrchestratorProps) {
	const form = usePlaylistForm(navigation, route.params?.playlistId);
	const playerHeight = usePlayerHeight();
	return <PlaylistFormView form={form} playerHeight={playerHeight} />;
}
