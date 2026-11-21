import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { useContextMenu } from '@/shared/theme/hooks/useContextMenu';
import { QueueSwipe } from '@/shared/theme/components/QueueSwipe';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';
import { AddableTrackItem } from '@/features/playlists/features/editor/features/search-tracks/components/presenters/AddableTrackItem';

type AddableTrackRowProps = {
	track: SoundCloudTrack;
	isAdded: boolean;
	onAdd: (track: SoundCloudTrack) => void;
	onAddToQueue: (track: SoundCloudTrack) => void;
	onShowActions: (track: SoundCloudTrack, anchor?: MenuAnchor) => void;
};

export function AddableTrackRow({
	track,
	isAdded,
	onAdd,
	onAddToQueue,
	onShowActions,
}: AddableTrackRowProps) {
	const { styles } = useThemedStyles(createStyles);
	const contextMenu = useContextMenu(() => onShowActions(track));

	return (
		<View style={styles.trackRow} {...contextMenu}>
			<QueueSwipe onAddToQueue={() => onAddToQueue(track)}>
				<AddableTrackItem
					track={track}
					isAdded={isAdded}
					onAdd={onAdd}
					onShowActions={onShowActions}
				/>
			</QueueSwipe>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		trackRow: {
			marginBottom: theme.spacing.xs,
		},
	});
	return styles;
}
