import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { SEGMENT_BAR, SEGMENTS } from '@/features/playback/shared/seek-bar/seekBarConfig';
import type { ProgressSliderColors } from '@/features/playback/shared/seek-bar/seekBarTypes';

type ProgressSegmentsProps = {
	position: number;
	total: number;
	colors: ProgressSliderColors;
};

function segmentColor(color: string): ViewStyle {
	return { backgroundColor: color };
}

export function ProgressSegments({ position, total, colors }: ProgressSegmentsProps) {
	const { styles } = useThemedStyles(createStyles);
	const lit = total ? Math.round((position / total) * SEGMENTS) : 0;

	return (
		<View style={styles.segments}>
			{Array.from({ length: SEGMENTS }, (_, i) => (
				<View
					key={i}
					style={[styles.segment, segmentColor(i < lit ? colors.slider : colors.sliderBg)]}
				/>
			))}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		segments: {
			...pixelFrame(theme),
			position: 'absolute',
			left: 0,
			right: 0,
			top: '50%',
			height: SEGMENT_BAR.height,
			marginTop: SEGMENT_BAR.marginTop,
			flexDirection: 'row',
			gap: theme.borders.thick,
			padding: theme.borders.thick,
		},
		segment: { flex: 1 },
	});
	return styles;
}
