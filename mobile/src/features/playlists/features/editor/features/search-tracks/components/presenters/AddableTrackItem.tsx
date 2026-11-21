import React from 'react';
import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Artwork } from '@/shared/theme/components/Artwork';
import { TrackActionsButton } from '@/shared/theme/components/TrackActionsButton';
import { Pressable } from '@/shared/theme/components/Pressable';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';
import { AddableTrackInfo } from '@/features/playlists/features/editor/features/search-tracks/components/presenters/AddableTrackInfo';
import { AddTrackBadge } from '@/features/playlists/features/editor/features/search-tracks/components/presenters/AddTrackBadge';

type AddableTrackItemProps = {
	track: SoundCloudTrack;
	isAdded: boolean;
	onAdd: (track: SoundCloudTrack) => void;
	onShowActions: (track: SoundCloudTrack, anchor?: MenuAnchor) => void;
};

export function AddableTrackItem({ track, isAdded, onAdd, onShowActions }: AddableTrackItemProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<Pressable
			style={styles.trackItem}
			onPress={() => !isAdded && onAdd(track)}
			onLongPress={() => onShowActions(track)}
			accessibilityLabel={`${track.title}, ${track.user.username}`}
		>
			<Artwork uri={track.artwork_url || track.user.avatar_url} size={52} style={styles.artwork} />
			<AddableTrackInfo track={track} />
			<TrackActionsButton onPress={anchor => onShowActions(track, anchor)} />
			<AddTrackBadge trackId={track.id} isAdded={isAdded} />
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		trackItem: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.sm,
			backgroundColor: theme.colors.background,
		},
		artwork: {
			marginRight: theme.spacing.md,
		},
	});
	return styles;
}
