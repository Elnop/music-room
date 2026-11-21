import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { useRadarSweep } from '@/features/events/features/nearby/hooks/useRadarSweep';
import { RadarUser } from '@/features/events/features/nearby/components/presenters/RadarUser';
import { RADAR_PING, RADAR_RINGS } from '@/features/events/features/nearby/configs/radarConfig';

export function RadarSweep() {
	const { styles } = useThemedStyles(createStyles);
	const { armStyle, pingStyle } = useRadarSweep();

	return (
		<>
			<Animated.View style={[styles.anchor, styles.arm, armStyle]} />
			<Animated.View style={[styles.anchor, styles.ping, pingStyle]} />
			<RadarUser />
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		anchor: { position: 'absolute', left: '50%' },
		arm: {
			bottom: 0,
			width: theme.borders.thick,
			height: RADAR_RINGS[2],
			backgroundColor: theme.colors.primary,
			opacity: 0.6,
			transformOrigin: 'bottom',
		},
		ping: {
			bottom: RADAR_PING.offset,
			width: RADAR_PING.size,
			height: RADAR_PING.size,
			marginLeft: RADAR_PING.offset,
			borderRadius: RADAR_PING.radius,
			borderWidth: theme.borders.thick,
			borderColor: theme.colors.primary,
		},
	});
	return styles;
}
