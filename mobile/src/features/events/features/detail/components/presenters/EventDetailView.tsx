import React from 'react';
import { ScrollView } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Button } from '@/shared/theme/components/Button';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { createEventScreenStyles } from '@/features/events/shared/event-screen/createEventScreenStyles';
import { EventDetailFallback } from '@/features/events/features/detail/components/presenters/EventDetailFallback';
import { EventDetailHeader } from '@/features/events/features/detail/components/presenters/EventDetailHeader';
import { EventDetailInfo } from '@/features/events/features/detail/components/presenters/EventDetailInfo';
import { EventOrganizerActions } from '@/features/events/features/detail/components/presenters/EventOrganizerActions';
import type {
	BeaconBroadcast,
	EventDetailScreen,
} from '@/features/events/features/detail/eventDetailTypes';

type EventDetailViewProps = {
	screen: EventDetailScreen;
	beacon: BeaconBroadcast;
	bottomPadding: number;
};

function bottomPaddingStyle(paddingBottom: number): ViewStyle {
	return { paddingBottom };
}

export function EventDetailView({ screen, beacon, bottomPadding }: EventDetailViewProps) {
	const { styles } = useThemedStyles(createEventScreenStyles);
	const { event } = screen;

	if (!event) return <EventDetailFallback failed={screen.failed} />;

	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={[styles.body, bottomPaddingStyle(bottomPadding)]}
		>
			<EventDetailHeader event={event} />
			<EventDetailInfo event={event} />
			{event.playlist && (
				<Button
					title={`Ouvrir la playlist « ${event.playlist.name} »`}
					onPress={screen.openPlaylist}
					variant="primary"
					fullWidth
				/>
			)}
			{screen.isOrganizer && <EventOrganizerActions screen={screen} beacon={beacon} />}
		</ScrollView>
	);
}
