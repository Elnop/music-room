import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { SectionHeader } from '@/shared/components/lists/SectionHeader';
import { Button } from '@/shared/components/ui/Button';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { NearbyEvents } from '@/features/events/nearby/hooks/useNearbyEvents';
import { EventRow } from './EventRow';

export function NearbyEventsSection({ nearby }: { nearby: NearbyEvents }) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View>
			<SectionHeader icon="location-outline" title="Événements à proximité" count={0} />
			<EmptyState icon="radio-outline" message="Aucun événement à proximité" />
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
