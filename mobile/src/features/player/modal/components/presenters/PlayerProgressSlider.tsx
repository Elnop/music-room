import React from 'react';
import { View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Slider from '@react-native-community/slider';
import type { SeekPosition } from '@/features/player/modal/hooks/useSeekPosition';
import { Text } from '@/shared/components/ui/Text';

const formatTime = (seconds: number): string => {
	if (!seconds || isNaN(seconds)) return '0:00';
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface PlayerProgressSliderProps {
	/** The full player stacks the times under the slider; the desktop player bar sets them on its sides. */
	styles: {
		progressContainer: StyleProp<ViewStyle>;
		slider: StyleProp<ViewStyle>;
		timeContainer: StyleProp<ViewStyle>;
		timeText: StyleProp<TextStyle>;
	};
	colors: {
		slider: string;
		sliderBg: string;
		textSecondary: string;
	};
	seek: SeekPosition;
	duration: number | null;
	hasTrack: boolean;
	disabled: boolean;
	onSliderAction: (actionName: string) => void;
}

export function PlayerProgressSlider({
	styles,
	colors,
	seek,
	duration,
	hasTrack,
	disabled,
	onSliderAction,
}: PlayerProgressSliderProps) {
	if (duration === null) return null;
	const currentTime = seek.position;

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
					onSlidingStart={seek.onSlidingStart}
					onValueChange={seek.onValueChange}
					onSlidingComplete={seek.onSlidingComplete}
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
