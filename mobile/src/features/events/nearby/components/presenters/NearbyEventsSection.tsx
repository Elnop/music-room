import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { SectionHeader } from '@/shared/components/lists/SectionHeader';
import { Button } from '@/shared/components/ui/Button';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { NearbyEvents } from '@/features/events/nearby/hooks/useNearbyEvents';
import { BeaconStatusLine } from './BeaconStatusLine';
import { EventRow } from './EventRow';

const NOTICE_ACTIONS = {
	request: { label: 'Autoriser la localisation', handler: 'requestPermission' },
	settings: { label: 'Ouvrir les réglages', handler: 'openSettings' },
} as const;

export function NearbyEventsSection({ nearby }: { nearby: NearbyEvents }) {
	const { styles } = useThemedStyles(createStyles);
	const action = nearby.notice.action && NOTICE_ACTIONS[nearby.notice.action];

	return (
		<View>
			<SectionHeader
				icon="location-outline"
				title="Événements à proximité"
				count={nearby.items.length}
			/>
			{nearby.items.length > 0 ? (
				nearby.items.map(({ event, proximity }) => (
					<EventRow
						key={event.id}
						event={event}
						proximity={proximity}
						onPress={() => nearby.openEvent(event.id)}
					/>
				))
			) : (
				<EmptyState
					icon="radio-outline"
					message={nearby.notice.message}
					action={action ? { label: action.label, onPress: nearby[action.handler] } : undefined}
				/>
			)}
			<BeaconStatusLine
				status={nearby.beaconStatus}
				onRequestPermission={nearby.requestBeaconPermission}
			/>
			{nearby.mine.length > 0 && (
				<View>
					<Text style={styles.subtitle}>Vos événements</Text>
					{nearby.mine.map(event => (
						<EventRow key={event.id} event={event} onPress={() => nearby.openEvent(event.id)} />
					))}
				</View>
			)}
			<View style={styles.create}>
				<Button
					title="Créer un événement"
					variant="outline"
					onPress={nearby.createEvent}
					fullWidth
				/>
			</View>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		subtitle: {
			fontSize: theme.typography.sizes.sm,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.textSecondary,
			paddingHorizontal: theme.spacing.md,
			marginTop: theme.spacing.sm,
		},
		create: { paddingHorizontal: theme.spacing.md, marginTop: theme.spacing.sm },
	});
