import React from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Slider from '@react-native-community/slider';
import type { SeekPosition } from '@/features/player/modal/hooks/useSeekPosition';
import { Text } from '@/shared/components/ui/Text';
import { pixelFrame } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

/** The track drawn as pixel blocks; the slider stays on top, invisible, to seek. */
const SEGMENTS = 24;

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
	const { styles: pixel } = useThemedStyles(createStyles);
	if (duration === null) return null;
	const currentTime = seek.position;
	const lit = hasTrack && duration ? Math.round((currentTime / duration) * SEGMENTS) : 0;

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
				<View style={pixel.segments}>
					{Array.from({ length: SEGMENTS }, (_, i) => (
						<View
							key={i}
							style={[pixel.segment, { backgroundColor: i < lit ? colors.slider : colors.sliderBg }]}
						/>
					))}
				</View>
				<Slider
					style={styles.slider}
					minimumValue={0}
					maximumValue={duration || 1}
					value={hasTrack ? currentTime : 0}
					onSlidingStart={seek.onSlidingStart}
					onValueChange={seek.onValueChange}
					onSlidingComplete={seek.onSlidingComplete}
					minimumTrackTintColor="transparent"
					maximumTrackTintColor="transparent"
					thumbTintColor="transparent"
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

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		segments: {
			...pixelFrame(theme),
			position: 'absolute',
			left: 0,
			right: 0,
			top: '50%',
			height: 15,
			marginTop: -7,
			flexDirection: 'row',
			gap: theme.borders.thick,
			padding: theme.borders.thick,
		},
		segment: { flex: 1 },
	});
