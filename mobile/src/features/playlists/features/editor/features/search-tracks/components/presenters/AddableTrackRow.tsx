import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { useContextMenu } from '@/shared/theme/hooks/useContextMenu';
import { QueueSwipe } from '@/shared/theme/components/QueueSwipe';
import { Artwork } from '@/shared/theme/components/Artwork';
import { PreviewBadge } from '@/shared/theme/components/PreviewBadge';
import { TrackActionsButton } from '@/shared/theme/components/TrackActionsButton';
import { Pressable } from '@/shared/theme/components/Pressable';
import { formatDuration } from '@/shared/formatting/formatters';
import { isPreviewOnly } from '@/shared/tracks/lib/isPreviewOnly';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import { Text } from '@/shared/theme/components/Text';
import CheckSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/check-solid.svg';
import PlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/plus-solid.svg';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';

type AddableTrackRowProps = {
	track: SoundCloudTrack;
	isAdded: boolean;
	onAdd: (track: SoundCloudTrack) => void;
	onAddToQueue: (track: SoundCloudTrack) => void;
	onShowActions: (track: SoundCloudTrack, anchor?: MenuAnchor) => void;
};

export const AddableTrackRow = React.memo(function AddableTrackRow({
	track,
	isAdded,
	onAdd,
	onAddToQueue,
	onShowActions,
}: AddableTrackRowProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const contextMenu = useContextMenu(() => onShowActions(track));

	return (
		<View style={styles.trackRow} {...contextMenu}>
			<QueueSwipe onAddToQueue={() => onAddToQueue(track)}>
				<Pressable
					style={styles.trackItem}
					onPress={() => !isAdded && onAdd(track)}
					onLongPress={() => onShowActions(track)}
					accessibilityLabel={`${track.title}, ${track.user.username}`}
				>
					<Artwork
						uri={track.artwork_url || track.user.avatar_url}
						size={52}
						style={styles.artwork}
					/>
					<View style={styles.trackInfo}>
						<Text style={styles.trackTitle} numberOfLines={1}>
							{track.title}
						</Text>
						<Text style={styles.trackArtist} numberOfLines={1}>
							{track.user.username}
						</Text>
						<View style={styles.trackMeta}>
							{isPreviewOnly(track) && <PreviewBadge />}
							<Text style={styles.trackDuration}>{formatDuration(track.duration)}</Text>
						</View>
					</View>
					<TrackActionsButton onPress={anchor => onShowActions(track, anchor)} />
					<View style={[styles.addButton, isAdded && styles.addedButton]}>
						<PixelIcon
							icon={isAdded ? CheckSolid : PlusSolid}
							size={20}
							color={theme.colors.onColor}
							testID={`${isAdded ? 'added' : 'add'}-${track.id}`}
						/>
					</View>
				</Pressable>
			</QueueSwipe>
		</View>
	);
});

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		trackRow: {
			marginBottom: theme.spacing.xs,
		},
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
		trackInfo: {
			flex: 1,
			marginRight: theme.spacing.sm,
		},
		trackMeta: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.xs,
		},
		trackTitle: {
			fontSize: 15,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
			marginBottom: 3,
		},
		trackArtist: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginBottom: 2,
		},
		trackDuration: {
			fontSize: 12,
			color: theme.colors.textSecondary,
		},
		addButton: {
			backgroundColor: theme.colors.primary,
			width: 36,
			height: 36,
			justifyContent: 'center',
			alignItems: 'center',
			marginLeft: theme.spacing.sm,
		},
		addedButton: {
			backgroundColor: theme.colors.success,
		},
	});
	return styles;
}
