import React from 'react';
import { StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Text } from '@/shared/components/ui/Text';
import { keycap } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { GENRE_INFO } from '@/types/user.types';
import { formatEventDate, isOngoing } from '@/features/events/utils/eventDates';
import type { MusicEvent } from '@/features/events/types';

interface EventRowProps {
	event: MusicEvent;
	onPress: () => void;
}

/** One of my events, as a key: its beacon, its name, when it starts. */
export function EventRow({ event, onPress }: EventRowProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const when = isOngoing(event) ? 'En cours' : formatEventDate(event.startsAt);
	const genres = event.genres.map(genre => GENRE_INFO[genre].label).join(' · ');

	return (
		<Pressable
			style={styles.row}
			onPress={onPress}
			accessibilityLabel={[event.name, when, genres].join(', ')}
		>
			<PixelIcon name="beacon" color={theme.colors.primary} />
			<Text style={styles.name} numberOfLines={1}>
				{event.name}
			</Text>
			<Text style={styles.when} numberOfLines={1}>
				{when}
			</Text>
		</Pressable>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		row: {
			...keycap(theme),
			height: 45,
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.sm,
			paddingHorizontal: theme.spacing.sm,
			backgroundColor: theme.colors.surfaceAlt,
		},
		name: {
			flex: 1,
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.text,
		},
		when: {
			fontSize: theme.typography.sizes.xs,
			fontFamily: theme.typography.families.mono,
			color: theme.colors.textSecondary,
		},
	});
