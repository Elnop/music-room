import React from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import type { createStyles } from './playerModalStyles';

const formatTime = (seconds: number): string => {
	if (!seconds || isNaN(seconds)) return '0:00';
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface PlayerProgressSliderProps {
	styles: ReturnType<typeof createStyles>;
	colors: {
		slider: string;
		sliderBg: string;
		textSecondary: string;
	};
	currentTime: number;
	duration: number | null;
	hasTrack: boolean;
	disabled: boolean;
	onSeek: (value: number) => void;
	onSliderAction: (actionName: string) => void;
}

export function PlayerProgressSlider({
	styles,
	colors,
	currentTime,
	duration,
	hasTrack,
	disabled,
	onSeek,
	onSliderAction,
}: PlayerProgressSliderProps) {
	if (duration === null) return null;

	const timeText = `${formatTime(hasTrack ? currentTime : 0)} sur ${formatTime(hasTrack ? duration : 0)}`;

	return (
		<View style={styles.progressContainer}>
			<View
				accessible
				accessibilityRole="adjustable"
				accessibilityLabel="Position de lecture"
				accessibilityValue={{ text: timeText }}
				accessibilityState={{ disabled }}
				accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
				onAccessibilityAction={event => {
					if (!disabled) onSliderAction(event.nativeEvent.actionName);
				}}
			>
				<Slider
					style={styles.slider}
					minimumValue={0}
					maximumValue={duration || 1}
					value={hasTrack ? currentTime : 0}
					onSlidingComplete={onSeek}
					minimumTrackTintColor={colors.slider}
					maximumTrackTintColor={colors.sliderBg}
					thumbTintColor={colors.slider}
					disabled={disabled}
					importantForAccessibility="no-hide-descendants"
				/>
			</View>
			<View style={styles.timeContainer}>
				<Text style={[styles.timeText, { color: colors.textSecondary }]}>
					{formatTime(hasTrack ? currentTime : 0)}
				</Text>
				<Text style={[styles.timeText, { color: colors.textSecondary }]}>
					{formatTime(hasTrack ? duration : 0)}
				</Text>
			</View>
		</View>
	);
}
