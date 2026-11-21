import React from 'react';
import { View } from 'react-native';
import type { createRowStyles } from '@/features/playback/features/queue-modal/components/presenters/queueModalStyles';
import { Text } from '@/shared/theme/components/Text';

interface QueueTrackDetailsProps {
	title: string;
	artist: string;
	isCurrent: boolean;
	styles: ReturnType<typeof createRowStyles>;
}

export function QueueTrackDetails({ title, artist, isCurrent, styles }: QueueTrackDetailsProps) {
	return (
		<View style={styles.trackInfo}>
			<Text style={[styles.trackTitle, isCurrent && styles.trackTitleCurrent]} numberOfLines={1}>
				{title}
			</Text>
			<Text style={styles.trackArtist} numberOfLines={1}>
				{artist}
			</Text>
		</View>
	);
}
