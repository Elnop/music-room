import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Avatar } from '@/shared/components/media/Avatar';
import { Button } from '@/shared/components/ui/Button';
import { GenreChip } from '@/shared/components/ui/GenreChip';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { EventDetailScreen } from '@/features/events/detail/hooks/useEventDetailScreen';
import { formatEventDate, isOngoing } from '@/features/events/utils/eventDates';
import { createEventScreenStyles } from '@/features/events/form/components/presenters/eventScreenStyles';
import { InfoRow } from './InfoRow';

interface EventDetailViewProps {
	screen: EventDetailScreen;
	bottomPadding: number;
}

export function EventDetailView({ screen, bottomPadding }: EventDetailViewProps) {
	const { styles: page } = useThemedStyles(createEventScreenStyles);
	const { styles } = useThemedStyles(createStyles);
	const { event } = screen;

	if (!event) {
		// A deleted event shows the spinner while its screen closes.
		if (!screen.failed) return <LoadingSpinner />;
		return <EmptyState icon="alert-circle-outline" message="Impossible de charger l'événement" />;
	}

	const organizer = event.organizer.displayName ?? event.organizer.username;

	return (
		<ScrollView
			style={page.screen}
			contentContainerStyle={[page.body, { paddingBottom: bottomPadding }]}
		>
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

			<InfoRow
				icon="time-outline"
				label="Quand"
				text={`${formatEventDate(event.startsAt)} → ${formatEventDate(event.endsAt)}`}
			/>
			<InfoRow icon="location-outline" label="Où" text={event.address} />
			{event.accessInfo && (
				<InfoRow icon="enter-outline" label="Comment y accéder" text={event.accessInfo} />
			)}
			{event.description && <Text style={styles.description}>{event.description}</Text>}

			{event.playlist && (
				<Button
					title={`Ouvrir la playlist « ${event.playlist.name} »`}
					onPress={screen.openPlaylist}
					variant="primary"
					fullWidth
				/>
			)}

			{screen.isOrganizer && (
				<View style={styles.actions}>
					<Button title="Modifier" onPress={screen.edit} variant="outline" fullWidth />
					<Button
						title="Supprimer"
						onPress={screen.remove}
						variant="secondary"
						loading={screen.isDeleting}
						fullWidth
					/>
				</View>
			)}
		</ScrollView>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		header: { gap: theme.spacing.sm },
		live: {
			alignSelf: 'flex-start',
			fontSize: theme.typography.sizes.sm,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.onColor,
			backgroundColor: theme.colors.success,
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: 2,
			borderRadius: 8,
			overflow: 'hidden',
		},
		title: {
			fontSize: theme.typography.sizes.xxl,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.text,
		},
		organizer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
		organizerText: { fontSize: theme.typography.sizes.md, color: theme.colors.textSecondary },
		genres: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
		description: { fontSize: theme.typography.sizes.md, color: theme.colors.text, lineHeight: 20 },
		actions: { gap: theme.spacing.sm, marginTop: theme.spacing.md },
	});
