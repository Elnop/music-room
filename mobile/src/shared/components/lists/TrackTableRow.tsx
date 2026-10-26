import React from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useHover } from '@/shared/hooks/useHover';
import { useSeparatorColor } from '@/shared/hooks/useSeparatorColor';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { formatDuration } from '@/shared/utils/formatters';
import type { Track } from '@/types/track.types';
import { TrackActionsButton } from './TrackActionsButton';
import { trackTableColumns as columns } from './trackTableLayout';
import { Text } from '@/shared/components/ui/Text';

interface TrackTableRowProps {
	track: Track;
	/** Its number in the list, from 1. */
	position: number;
	isCurrent: boolean;
	isPending: boolean;
	unavailable: boolean;
	isDragActive: boolean;
	onPress?: () => void;
	onShowActions?: () => void;
	onDragStart?: () => void;
}

/** A track as a table row on wide screens: the pointer over it shows play and the drag handle. */
export function TrackTableRow({
	track,
	position,
	isCurrent,
	isPending,
	unavailable,
	isDragActive,
	onPress,
	onShowActions,
	onDragStart,
}: TrackTableRowProps) {
	const { theme } = useTheme();
	const separator = useSeparatorColor();
	const styles = React.useMemo(() => createStyles(theme, separator), [theme, separator]);
	const { hovered, hoverProps } = useHover();
	const showPlay = hovered && !unavailable && !isPending && !!onPress;

	return (
		<View
			{...hoverProps}
			style={[
				styles.row,
				(hovered || isCurrent) && styles.rowHighlighted,
				isDragActive && styles.rowActive,
			]}
		>
			{/* The row's buttons sit beside its pressable area, never in it: the web nests no <button>. */}
			<Pressable
				onPress={onPress}
				onLongPress={onShowActions}
				accessibilityLabel={`${position}. ${track.title}, ${track.artist}${unavailable ? ', indisponible' : ''}`}
				accessibilityState={{ selected: isCurrent, busy: isPending, disabled: unavailable }}
				style={styles.pressable}
			>
				<View style={columns.position}>
					{isPending ? (
						<ActivityIndicator
							size="small"
							color={theme.colors.primary}
							accessibilityLabel="Lancement"
						/>
					) : showPlay ? (
						<Ionicons name="play" size={16} color={theme.colors.text} />
					) : isCurrent ? (
						<Ionicons
							name="volume-high"
							size={16}
							color={theme.colors.primary}
							accessibilityLabel="En cours de lecture"
						/>
					) : (
						<Text style={styles.position}>{position}</Text>
					)}
				</View>
				<View style={[columns.title, unavailable && styles.unavailable]}>
					{track.albumArt ? (
						<Image source={{ uri: track.albumArt }} style={styles.albumArt} />
					) : (
						<View style={[styles.albumArt, styles.albumArtPlaceholder]}>
							<Ionicons name="musical-notes" size={18} color={theme.colors.textSecondary} />
						</View>
					)}
					<Text style={[styles.title, isCurrent && styles.titleCurrent]} numberOfLines={1}>
						{track.title}
					</Text>
				</View>
				<View style={[columns.artist, unavailable && styles.unavailable]}>
					<Text style={styles.secondary} numberOfLines={1}>
						{unavailable ? `Indisponible · ${track.artist}` : track.artist}
					</Text>
				</View>
				<View style={columns.duration}>
					{track.durationMs ? (
						<Text style={styles.secondary}>{formatDuration(track.durationMs)}</Text>
					) : null}
				</View>
			</Pressable>
			<View style={[columns.trailing, styles.trailing]}>
				{onShowActions && <TrackActionsButton onPress={onShowActions} />}
				{onDragStart && (
					<Pressable
						onPressIn={onDragStart}
						hitSlop={10}
						// Faint until the pointer is over the row, so a touch screen still shows it.
						style={[styles.dragHandle, !hovered && !isDragActive && styles.dragHandleIdle]}
						accessibilityLabel="Réordonner"
					>
						<Ionicons name="reorder-three-outline" size={22} color={theme.colors.textSecondary} />
					</Pressable>
				)}
			</View>
		</View>
	);
}

const createStyles = (theme: Theme, separator: string) =>
	StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: 12,
			paddingVertical: 6,
			borderBottomWidth: 1,
			borderBottomColor: separator,
			backgroundColor: theme.colors.background,
		},
		rowHighlighted: { backgroundColor: theme.colors.surface },
		rowActive: {
			backgroundColor: theme.colors.surfaceAlt,
			shadowColor: theme.colors.shadow,
			shadowOpacity: 0.25,
			shadowRadius: 6,
			shadowOffset: { width: 0, height: 3 },
		},
		pressable: { flex: 1, flexDirection: 'row', alignItems: 'center' },
		position: { fontSize: theme.typography.sizes.md, color: theme.colors.textSecondary },
		albumArt: { width: 40, height: 40, borderRadius: 4, marginRight: 12 },
		albumArtPlaceholder: {
			backgroundColor: theme.colors.surfaceAlt,
			justifyContent: 'center',
			alignItems: 'center',
		},
		title: {
			flex: 1,
			fontSize: 15,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		titleCurrent: { color: theme.colors.primary },
		secondary: { fontSize: 13, color: theme.colors.textSecondary },
		unavailable: { opacity: 0.4 },
		trailing: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
		dragHandle: { marginLeft: theme.spacing.xs, padding: theme.spacing.xs },
		dragHandleIdle: { opacity: 0.3 },
	});
