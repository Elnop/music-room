import React from 'react';
import { View } from 'react-native';
import type { TextStyle } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { formatTime } from '@/features/playback/shared/seek-bar/lib/formatTime';
import type { ProgressSliderStyles } from '@/features/playback/shared/seek-bar/seekBarTypes';

type ProgressTimesProps = {
	styles: ProgressSliderStyles;
	color: string;
	position: number;
	total: number;
};

function textColor(color: string): TextStyle {
	return { color };
}

export function ProgressTimes({ styles, color, position, total }: ProgressTimesProps) {
	return (
		<View style={styles.timeContainer}>
			<Text style={[styles.timeText, textColor(color)]}>{formatTime(position)}</Text>
			<Text style={[styles.timeText, textColor(color)]}>{formatTime(total)}</Text>
		</View>
	);
}
