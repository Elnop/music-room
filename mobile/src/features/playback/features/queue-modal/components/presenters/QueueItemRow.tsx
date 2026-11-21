import React from 'react';
import { View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { useContextMenu } from '@/shared/theme/hooks/useContextMenu';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Artwork } from '@/shared/theme/components/Artwork';
import { TrackActionsButton } from '@/shared/theme/components/TrackActionsButton';
import { QueueTrackDetails } from './QueueTrackDetails';
import { createRowStyles, formatDuration } from './queueModalStyles';
import type { QueueItem } from '@/features/playback/shared/player/lib/queue.types';
import { Text } from '@/shared/theme/components/Text';
import BarsSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/bars-solid.svg';
import SoundOnSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/sound-on-solid.svg';
import TrashSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/trash-solid.svg';
import type { MenuAnchor } from '@/shared/theme/lib/menuPlacement';

interface QueueItemRowProps {
	item: QueueItem;
	isCurrent?: boolean;
	onPlay: (itemId: string) => void;
	onRemove: (itemId: string) => Promise<boolean>;
	onDragStart?: () => void;
	isDragActive?: boolean;
	onShowActions?: (item: QueueItem, anchor?: MenuAnchor) => void;
}

export function QueueItemRow({
	item,
	isCurrent = false,
	onPlay,
	onRemove,
	onDragStart,
	isDragActive = false,
	onShowActions,
}: QueueItemRowProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createRowStyles(theme), [theme]);
	const swipeableRef = React.useRef<Swipeable>(null);
	const { track } = item;
	const contextMenu = useContextMenu(onShowActions ? () => onShowActions(item) : undefined);

	const handleRemove = async () => {
		const removed = await onRemove(item.id);
		if (!removed) swipeableRef.current?.close();
	};

	const renderRightActions = () => (
		<Pressable
			style={styles.deleteButton}
			onPress={handleRemove}
			accessibilityRole="button"
			accessibilityLabel={`Retirer ${track.title}`}
		>
			<PixelIcon icon={TrashSolid} size={24} color={theme.colors.onColor} />
			<Text style={styles.deleteText}>Retirer</Text>
		</Pressable>
	);

	return (
		<Swipeable
			ref={swipeableRef}
			renderRightActions={renderRightActions}
			overshootRight={false}
			friction={2}
		>
			<View
				{...contextMenu}
				style={[styles.row, isCurrent && styles.rowCurrent, isDragActive && styles.rowActive]}
			>
				<Pressable
					onPress={() => onPlay(item.id)}
					onLongPress={onShowActions ? () => onShowActions(item) : undefined}
					style={styles.rowMain}
					accessibilityRole="button"
					accessibilityLabel={`Lire ${track.title}`}
					accessibilityState={{ selected: isCurrent }}
					testID={`queue-item-${item.id}`}
				>
					<Artwork uri={track.albumArt} size={42} />

					<QueueTrackDetails
						title={track.title}
						artist={track.artist}
						isCurrent={isCurrent}
						styles={styles}
					/>

					{isCurrent ? (
						<PixelIcon
							icon={SoundOnSolid}
							size={18}
							color={theme.colors.primary}
							style={styles.playingIcon}
							accessibilityLabel="En cours de lecture"
						/>
					) : null}

					<Text style={styles.duration}>{formatDuration(track.durationMs)}</Text>
				</Pressable>

				{onShowActions && <TrackActionsButton onPress={anchor => onShowActions(item, anchor)} />}

				{onDragStart && (
					<Pressable
						onPressIn={onDragStart}
						hitSlop={10}
						style={styles.dragHandle}
						accessibilityRole="button"
						accessibilityLabel="Réordonner"
					>
						<PixelIcon icon={BarsSolid} size={24} color={theme.colors.textSecondary} />
					</Pressable>
				)}
			</View>
		</Swipeable>
	);
}
