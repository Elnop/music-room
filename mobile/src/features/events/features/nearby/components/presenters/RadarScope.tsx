import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { RadarSweep } from '@/features/events/features/nearby/components/presenters/RadarSweep';
import { RADAR_HEIGHT, RADAR_RINGS } from '@/features/events/features/nearby/configs/radarConfig';

type RadarScopeProps = {
	children?: React.ReactNode;
};

function ringStyle(radius: number): ViewStyle {
	return {
		width: radius * 2,
		height: radius * 2,
		borderRadius: radius,
		marginLeft: -radius,
		top: RADAR_HEIGHT - radius,
	};
}

export function RadarScope({ children }: RadarScopeProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.scope}>
			{RADAR_RINGS.map(radius => (
				<View key={radius} style={[styles.ring, ringStyle(radius)]} />
			))}
			<RadarSweep />
			{children}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		scope: {
			...pixelFrame(theme),
			height: RADAR_HEIGHT,
			overflow: 'hidden',
			backgroundColor: theme.colors.radar,
			marginHorizontal: theme.spacing.md,
		},
		ring: {
			position: 'absolute',
			left: '50%',
			borderWidth: theme.borders.thick,
			borderStyle: 'dashed',
			borderColor: theme.colors.primary,
			opacity: 0.3,
		},
	});
	return styles;
}
