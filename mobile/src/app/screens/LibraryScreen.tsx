import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LibraryContainer } from '@/features/playlists/features/browse/features/library/components/LibraryContainer';
import { PlanContainer } from '@/features/subscription/PlanContainer';
import { PlaylistCardMenuContainer } from '@/features/playlists/features/editor/features/card-menu/PlaylistCardMenuContainer';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/lib/types';

type LibraryScreenProps = NativeStackScreenProps<PlaylistStackParamList, 'Playlists'>;

export function LibraryScreen(props: LibraryScreenProps) {
	return (
		<PlanContainer>
			{plan => (
				<PlaylistCardMenuContainer navigation={props.navigation} premium={plan}>
					{actionsFor => <LibraryContainer {...props} actionsFor={actionsFor} />}
				</PlaylistCardMenuContainer>
			)}
		</PlanContainer>
	);
}
