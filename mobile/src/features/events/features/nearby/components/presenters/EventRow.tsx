import React from 'react';
import { StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { keycap } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { GENRE_INFO } from '@/shared/theme/configs/genresConfig';
import { formatEventDate, isOngoing } from '@/features/events/shared/event-dates/eventDates';
import type { MusicEvent } from '@/features/events/lib/types';
import WifiSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/wifi-solid.svg';

type EventRowProps = {
	event: MusicEvent;
	onPress: () => void;
};

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
			<PixelIcon icon={WifiSolid} color={theme.colors.primary} />
			<Text style={styles.name} numberOfLines={1}>
				{event.name}
			</Text>
			<Text style={styles.when} numberOfLines={1}>
				{when}
			</Text>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
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
	return styles;
}
