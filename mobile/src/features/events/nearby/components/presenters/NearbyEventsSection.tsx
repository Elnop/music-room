import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { SectionHeader } from '@/shared/components/lists/SectionHeader';

export function NearbyEventsSection() {
	return (
		<View>
			<SectionHeader icon="location-outline" title="Événements à proximité" count={0} />
			<EmptyState icon="radio-outline" message="Aucun événement à proximité" />
		</View>
	);
}
