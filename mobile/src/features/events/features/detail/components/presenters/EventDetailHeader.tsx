import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/shared/theme/components/Avatar';
import { GenreChip } from '@/shared/theme/components/GenreChip';
import { Text } from '@/shared/theme/components/Text';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { isOngoing } from '@/features/events/shared/event-dates/eventDates';
import type { MusicEvent } from '@/features/events/eventTypes';

type EventDetailHeaderProps = {
	event: MusicEvent;
};

export function EventDetailHeader({ event }: EventDetailHeaderProps) {
	const { styles } = useThemedStyles(createStyles);
	const organizer = event.organizer.displayName ?? event.organizer.username;

	return (
		<>
			<View style={styles.header}>
				{isOngoing(event) && <Text style={styles.live}>En cours</Text>}
				<Text style={styles.title}>{event.name}</Text>
				<View style={styles.organizer}>
					<Avatar uri={event.organizer.avatarUrl} name={organizer} size="sm" />
					<Text style={styles.organizerText}>Organisé par {organizer}</Text>
				</View>
			</View>
			<View style={styles.genres}>
				{event.genres.map(genre => (
					<GenreChip key={genre} genre={genre} size="sm" selected />
				))}
			</View>
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		header: { gap: theme.spacing.sm },
		live: {
			alignSelf: 'flex-start',
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.onColor,
			backgroundColor: theme.colors.success,
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: theme.spacing.xxs,
			overflow: 'hidden',
		},
		title: {
			fontSize: theme.typography.sizes.xxl,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		organizer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
		organizerText: { fontSize: theme.typography.sizes.md, color: theme.colors.textSecondary },
		genres: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
	});
	return styles;
}
