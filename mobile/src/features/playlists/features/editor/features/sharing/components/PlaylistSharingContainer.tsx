import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/playlistTypes';
import { usePlaylistSharing } from '@/features/playlists/features/editor/features/sharing/hooks/usePlaylistSharing';
import { SharingView } from '@/features/playlists/features/editor/features/sharing/components/presenters/SharingView';

type PlaylistSharingOrchestratorProps = NativeStackScreenProps<
	PlaylistStackParamList,
	'PlaylistSharing'
>;

export function PlaylistSharingContainer({ route }: PlaylistSharingOrchestratorProps) {
	const sharing = usePlaylistSharing(route.params.playlistId);
	return <SharingView sharing={sharing} />;
}
