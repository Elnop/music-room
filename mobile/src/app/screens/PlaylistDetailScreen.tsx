import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlanContainer } from '@/features/subscription/PlanContainer';
import { PlaylistPlaybackContainer } from '@/features/playback/components/PlaylistPlaybackContainer';
import { PlaylistDetailContainer } from '@/features/playlists/features/editor/features/detail/components/PlaylistDetailContainer';
import { TrackActionsSheet } from '@/app/TrackActionsSheet';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/playlistTypes';

type PlaylistDetailScreenProps = NativeStackScreenProps<PlaylistStackParamList, 'PlaylistDetail'>;

export function PlaylistDetailScreen(props: PlaylistDetailScreenProps) {
	return (
		<PlanContainer>
			{(plan) => (
				<PlaylistPlaybackContainer playlistId={props.route.params.id}>
					{(playback) => (
						<PlaylistDetailContainer
							{...props}
							premium={plan}
							TrackActionsSheet={TrackActionsSheet}
							playback={playback}
						/>
					)}
				</PlaylistPlaybackContainer>
			)}
		</PlanContainer>
	);
}
