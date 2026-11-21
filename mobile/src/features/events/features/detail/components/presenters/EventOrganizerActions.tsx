import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/shared/theme/components/Button';
import { BEACON_BROADCAST_AVAILABLE } from '@/shared/platform/platformConfig';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { BeaconCard } from '@/features/events/features/detail/components/presenters/BeaconCard';
import { BeaconUnavailableCard } from '@/features/events/features/detail/components/presenters/BeaconUnavailableCard';
import type {
	BeaconBroadcast,
	EventDetailScreen,
} from '@/features/events/features/detail/eventDetailTypes';

type EventOrganizerActionsProps = {
	screen: EventDetailScreen;
	beacon: BeaconBroadcast;
};

export function EventOrganizerActions({ screen, beacon }: EventOrganizerActionsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
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
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		actions: { gap: theme.spacing.sm, marginTop: theme.spacing.md },
	});
	return styles;
}
