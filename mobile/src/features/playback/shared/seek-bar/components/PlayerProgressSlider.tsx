import React from 'react';
import { View } from 'react-native';
import { ProgressSegments } from '@/features/playback/shared/seek-bar/components/ProgressSegments';
import { ProgressTimes } from '@/features/playback/shared/seek-bar/components/ProgressTimes';
import { SeekSlider } from '@/features/playback/shared/seek-bar/components/SeekSlider';
import { adjustableProps } from '@/features/playback/shared/seek-bar/lib/adjustableProps';
import type {
	ProgressSliderAppearance,
	SeekPosition,
} from '@/features/playback/shared/seek-bar/seekBarTypes';

type PlayerProgressSliderProps = {
	appearance: ProgressSliderAppearance;
	seek: SeekPosition;
	duration: number | null;
	hasTrack: boolean;
	disabled: boolean;
	onSliderAction: (actionName: string) => void;
};

export function PlayerProgressSlider(props: PlayerProgressSliderProps) {
	const { styles, colors } = props.appearance;
	if (props.duration === null) return null;
	const position = props.hasTrack ? props.seek.position : 0;
	const total = props.hasTrack ? props.duration : 0;

	return (
		<View style={styles.progressContainer}>
			<View {...adjustableProps({ position, total }, props.disabled, props.onSliderAction)}>
				<ProgressSegments position={position} total={total} colors={colors} />
				<SeekSlider
					style={styles.slider}
					seek={props.seek}
					range={{ value: position, maximum: props.duration || 1 }}
					disabled={props.disabled}
				/>
			</View>
			<ProgressTimes
				styles={styles}
				color={colors.textSecondary}
				position={position}
				total={total}
			/>
		</View>
	);
}
