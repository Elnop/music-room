import React from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useContextMenu } from '@/shared/theme/hooks/useContextMenu';
import { QueueSwipe } from '@/shared/theme/components/QueueSwipe';
import { TrackActionsButton } from '@/shared/theme/components/TrackActionsButton';
import { TrackTableRow } from './TrackTableRow';
import type { Theme } from '@/shared/theme/lib/types';
import type { Track } from '@/shared/tracks/lib/track.types';
import { Text } from '@/shared/theme/components/Text';
import { FONT_FAMILIES } from '@/shared/theme/lib/fonts';
import { pixelRow } from '@/shared/theme/lib/pixelFrame';
import { formatDuration } from '@/shared/formatting/formatters';
import BarsSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/bars-solid.svg';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';
import SoundOnSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/sound-on-solid.svg';
import TrashSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/trash-solid.svg';
import type { MenuAnchor } from '@/shared/theme/lib/menuPlacement';

interface SwipeableTrackItemProps {
	track: Track;
	onDelete: (trackId: string) => Promise<void>;
	disabled?: boolean;
	onAddToQueue?: () => void;
	onDragStart?: () => void;
	isDragActive?: boolean;
	onShowActions?: (anchor?: MenuAnchor) => void;
	isCurrent?: boolean;
	onPress?: () => void;
	isPending?: boolean;
	unavailable?: boolean;
	position?: number;
}

export function SwipeableTrackItem({
	track,
	onDelete,
	disabled = false,
	onAddToQueue,
	onDragStart,
	isDragActive = false,
	onShowActions,
	isCurrent = false,
	onPress,
	isPending = false,
	unavailable = false,
	position,
}: SwipeableTrackItemProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const actions = unavailable ? undefined : onShowActions;
	const { isWide } = useBreakpoint();
	const dragStart = !disabled ? onDragStart : undefined;
	const contextMenu = useContextMenu(actions);

	const renderRightActions = () => (
		<Pressable
			style={styles.deleteButton}
			onPress={() => onDelete(track.id)}
			accessibilityLabel={`Supprimer ${track.title}`}
		>
			<PixelIcon icon={TrashSolid} size={24} color={theme.colors.onColor} />
			<Text style={styles.deleteText}>Supprimer</Text>
		</Pressable>
	);

	return (
		<QueueSwipe
			onAddToQueue={unavailable ? undefined : onAddToQueue}
			renderRightActions={disabled ? undefined : renderRightActions}
		>
			{isWide && position !== undefined ? (
				<TrackTableRow
					track={track}
					position={position}
					isCurrent={isCurrent}
					isPending={isPending}
					unavailable={unavailable}
					isDragActive={isDragActive}
					onPress={onPress}
					onShowActions={actions}
					onDragStart={dragStart}
				/>
			) : (
				<View
					{...contextMenu}
					style={[
						styles.trackContainer,
						isCurrent && styles.trackContainerCurrent,
						isDragActive && styles.trackContainerActive,
					]}
				>
					<Pressable
						onPress={onPress}
						onLongPress={actions ? () => actions() : undefined}
						accessibilityLabel={`${track.title}, ${track.artist}${unavailable ? ', indisponible' : ''}`}
						accessibilityHint={actions ? 'Appui long pour les actions du titre' : undefined}
						accessibilityState={{ selected: isCurrent, busy: isPending, disabled: unavailable }}
						style={styles.trackPressable}
					>
						{track.albumArt ? (
							<Image
								source={{ uri: track.albumArt }}
								style={[styles.albumArt, unavailable && styles.unavailable]}
							/>
						) : (
							<View
								style={[
									styles.albumArt,
									styles.albumArtPlaceholder,
									unavailable && styles.unavailable,
								]}
							>
								<PixelIcon icon={MusicSolid} color={theme.colors.textSecondary} />
							</View>
						)}

						<View style={[styles.trackInfo, unavailable && styles.unavailable]}>
							<Text
								style={[styles.trackTitle, isCurrent && styles.trackTitleCurrent]}
								numberOfLines={1}
							>
								{track.title}
							</Text>
							<Text style={styles.trackArtist} numberOfLines={1}>
								{unavailable ? `Indisponible · ${track.artist}` : track.artist}
							</Text>
						</View>

						{isPending && (
							<ActivityIndicator
								size="small"
								color={theme.colors.primary}
								style={styles.playingIcon}
								accessibilityLabel="Lancement"
							/>
						)}

						{isCurrent && !isPending && (
							<PixelIcon
								icon={SoundOnSolid}
								size={18}
								color={theme.colors.primary}
								style={styles.playingIcon}
								accessibilityLabel="En cours de lecture"
							/>
						)}

						{track.durationMs ? (
							<Text style={styles.duration}>{formatDuration(track.durationMs)}</Text>
						) : null}
					</Pressable>

					{actions && <TrackActionsButton onPress={actions} />}

					{dragStart && (
						<Pressable
							onPressIn={dragStart}
							hitSlop={10}
							style={styles.dragHandle}
							accessibilityLabel="Réordonner"
						>
							<PixelIcon icon={BarsSolid} color={theme.colors.textSecondary} />
						</Pressable>
					)}
				</View>
			)}
		</QueueSwipe>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		trackContainer: pixelRow(theme),
		trackPressable: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.md,
		},
		trackContainerCurrent: {
			backgroundColor: theme.colors.surfaceAlt,
		},
		albumArt: {
			width: 42,
			height: 42,
		},
		albumArtPlaceholder: {
			backgroundColor: theme.colors.border,
			justifyContent: 'center',
			alignItems: 'center',
		},
		trackInfo: {
			flex: 1,
		},
		trackTitle: {
			fontSize: 15,
			fontFamily: FONT_FAMILIES.semibold,
			color: theme.colors.text,
			marginBottom: 4,
		},
		trackTitleCurrent: {
			color: theme.colors.primary,
		},
		playingIcon: {
			marginRight: 8,
		},
		trackArtist: {
			fontSize: 13,
			color: theme.colors.textSecondary,
		},
		duration: {
			fontSize: 11,
			fontFamily: FONT_FAMILIES.mono,
			color: theme.colors.textSecondary,
		},
		unavailable: {
			opacity: 0.4,
		},
		trackContainerActive: {
			...theme.shadows.large,
		},
		dragHandle: {
			marginLeft: theme.spacing.sm,
			padding: theme.spacing.xs,
		},
		deleteButton: {
			backgroundColor: theme.colors.error,
			justifyContent: 'center',
			alignItems: 'center',
			width: 100,
			height: '100%',
		},
		deleteText: {
			color: theme.colors.onColor,
			fontSize: 12,
			fontFamily: FONT_FAMILIES.semibold,
			marginTop: 4,
		},
	});
