import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { GENRE_INFO } from '@/types/user.types';
import { formatEventDate, isOngoing } from '@/features/events/utils/eventDates';
import type { MusicEvent } from '@/features/events/types';
import { Text } from '@/shared/components/ui/Text';

interface EventRowProps {
	event: MusicEvent;
	/** Where the event is from the user: a distance, or "Tout près" for a beacon. */
	proximity?: string;
	onPress: () => void;
}

export function EventRow({ event, proximity, onPress }: EventRowProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const when = isOngoing(event) ? 'En cours' : formatEventDate(event.startsAt);
	const genres = event.genres.map(genre => GENRE_INFO[genre].label).join(' · ');

	return (
		<Pressable
			style={styles.row}
			onPress={onPress}
			accessibilityLabel={[event.name, proximity, when, genres].filter(Boolean).join(', ')}
		>
			<View style={styles.icon}>
				<Ionicons name="musical-notes" size={20} color={theme.colors.onColor} />
			</View>
			<View style={styles.body}>
				<Text style={styles.name} numberOfLines={1}>
					{event.name}
				</Text>
				<Text style={styles.meta} numberOfLines={1}>
					{[when, genres].join(' · ')}
				</Text>
			</View>
			{proximity && <Text style={styles.proximity}>{proximity}</Text>}
			<Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
		</Pressable>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.md,
			paddingVertical: theme.spacing.sm,
			paddingHorizontal: theme.spacing.md,
		},
		icon: {
			width: 40,
			height: 40,
			borderRadius: 20,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: theme.colors.primary,
		},
		body: { flex: 1 },
		name: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		meta: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary, marginTop: 2 },
		proximity: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.primary,
		},
	});
