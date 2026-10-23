import React from 'react';
import { View, Text } from 'react-native';
import { createRowStyles } from './queueModalStyles';

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
