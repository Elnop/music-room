import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { usePlaylistSharing } from '@/features/playlists/sharing/hooks/usePlaylistSharing';
import { SharingView } from '@/features/playlists/sharing/components/presenters/SharingView';

type PlaylistSharingOrchestratorProps = NativeStackScreenProps<
	PlaylistStackParamList,
	'PlaylistSharing'
>;

/** The « Visibilité et droits » screen of a playlist's owner. */
export function PlaylistSharingOrchestrator({ route }: PlaylistSharingOrchestratorProps) {
	const sharing = usePlaylistSharing(route.params.playlistId);
	return <SharingView sharing={sharing} />;
}
