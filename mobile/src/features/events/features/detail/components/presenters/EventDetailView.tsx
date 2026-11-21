import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { Avatar } from '@/shared/theme/components/Avatar';
import { Button } from '@/shared/theme/components/Button';
import { BEACON_BROADCAST_AVAILABLE } from '@/shared/platform/platformConfig';
import { GenreChip } from '@/shared/theme/components/GenreChip';
import { LoadingSpinner } from '@/shared/theme/components/LoadingSpinner';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { EventDetailScreen } from '@/features/events/features/detail/hooks/useEventDetailScreen';
import { formatEventDate, isOngoing } from '@/features/events/shared/event-dates/eventDates';
import { createEventScreenStyles } from '@/features/events/shared/event-screen/eventScreenStyles';
import type { BeaconBroadcast } from '@/features/events/features/detail/hooks/useBeaconBroadcast';
import { BeaconCard } from '@/features/events/features/detail/components/presenters/BeaconCard';
import { BeaconUnavailableCard } from '@/features/events/features/detail/components/presenters/BeaconUnavailableCard';
import { InfoRow } from '@/features/events/features/detail/components/presenters/InfoRow';
import { Text } from '@/shared/theme/components/Text';
import ClockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/clock-solid.svg';
import ExclamationTriangleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/exclamation-triangle-solid.svg';
import LoginSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/login-solid.svg';
import WifiSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/wifi-solid.svg';

interface EventDetailViewProps {
	screen: EventDetailScreen;
	beacon: BeaconBroadcast;
	bottomPadding: number;
}

export function EventDetailView({ screen, beacon, bottomPadding }: EventDetailViewProps) {
	const { styles: page } = useThemedStyles(createEventScreenStyles);
	const { styles } = useThemedStyles(createStyles);
	const { event } = screen;

	if (!event) {
		if (!screen.failed) return <LoadingSpinner />;
		return (
			<EmptyState icon={ExclamationTriangleSolid} message="Impossible de charger l'événement" />
		);
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
				icon={ClockSolid}
				label="Quand"
				text={`${formatEventDate(event.startsAt)} → ${formatEventDate(event.endsAt)}`}
			/>
			<InfoRow icon={WifiSolid} label="Où" text={event.address} />
			{event.accessInfo && (
				<InfoRow icon={LoginSolid} label="Comment y accéder" text={event.accessInfo} />
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
					{BEACON_BROADCAST_AVAILABLE ? <BeaconCard beacon={beacon} /> : <BeaconUnavailableCard />}
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

function createStyles(theme: Theme) {
	return StyleSheet.create({
		header: { gap: theme.spacing.sm },
		live: {
			alignSelf: 'flex-start',
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.onColor,
			backgroundColor: theme.colors.success,
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: 2,
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
		description: { fontSize: theme.typography.sizes.md, color: theme.colors.text, lineHeight: 20 },
		actions: { gap: theme.spacing.sm, marginTop: theme.spacing.md },
	});
}
