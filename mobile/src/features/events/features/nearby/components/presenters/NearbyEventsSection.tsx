import React from 'react';
import { View } from 'react-native';
import { RadarScope } from '@/features/events/features/nearby/components/presenters/RadarScope';
import { RadarBlip } from '@/features/events/features/nearby/components/presenters/RadarBlip';
import { RadarNotice } from '@/features/events/features/nearby/components/presenters/RadarNotice';
import { RadarCount } from '@/features/events/features/nearby/components/presenters/RadarCount';
import { MyEvents } from '@/features/events/features/nearby/components/presenters/MyEvents';
import { BeaconStatusLine } from '@/features/events/features/nearby/components/presenters/BeaconStatusLine';
import type { NearbyEvents } from '@/features/events/features/nearby/nearbyTypes';

type NearbyEventsSectionProps = {
	nearby: NearbyEvents;
};

export function NearbyEventsSection({ nearby }: NearbyEventsSectionProps) {
	return (
		<View accessibilityLabel="Événements à proximité">
			<RadarScope>
				{nearby.items.map((item, rank) => (
					<RadarBlip
						key={item.event.id}
						item={item}
						rank={rank}
						total={nearby.items.length}
						onOpen={nearby.openEvent}
					/>
				))}
				{nearby.items.length === 0 && <RadarNotice nearby={nearby} />}
				<RadarCount count={nearby.items.length} />
			</RadarScope>
			<MyEvents events={nearby.mine} onOpen={nearby.openEvent} onCreate={nearby.createEvent} />
			<BeaconStatusLine
				status={nearby.beaconStatus}
				onRequestPermission={nearby.requestBeaconPermission}
			/>
		</View>
	);
}
