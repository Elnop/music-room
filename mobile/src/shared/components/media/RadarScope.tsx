import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useLoop } from '@/shared/hooks/useLoop';
import { pixelFrame } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const HEIGHT = 216;
const RINGS = [60, 130, 200];

/** A half-disc radar with the user at the bottom centre; the children are placed over it. */
export function RadarScope({ children }: { children?: React.ReactNode }) {
	const { styles } = useThemedStyles(createStyles);
	const sweep = useLoop(true, 4000);
	const rotate = sweep.interpolate({
		inputRange: [0, 0.5, 1],
		outputRange: ['-80deg', '80deg', '-80deg'],
	});
	const ping = useLoop(true, 1600);
	const pingScale = ping.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
	const pingOpacity = ping.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

	return (
		<View style={styles.scope}>
			{RINGS.map(radius => (
				<View
					key={radius}
					style={[
						styles.ring,
						{ width: radius * 2, height: radius * 2, borderRadius: radius, marginLeft: -radius, top: HEIGHT - radius },
					]}
				/>
			))}
			<Animated.View style={[styles.arm, { transform: [{ rotate }] }]} />
			<Animated.View style={[styles.ping, { opacity: pingOpacity, transform: [{ scale: pingScale }] }]} />
			<View style={styles.user} />
			{children}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		scope: {
			...pixelFrame(theme),
			height: HEIGHT,
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
		arm: {
			position: 'absolute',
			left: '50%',
			bottom: 0,
			width: theme.borders.thick,
			height: RINGS[2],
			backgroundColor: theme.colors.primary,
			opacity: 0.6,
			transformOrigin: 'bottom',
		},
		ping: {
			position: 'absolute',
			left: '50%',
			bottom: -30,
			width: 60,
			height: 60,
			marginLeft: -30,
			borderRadius: 30,
			borderWidth: theme.borders.thick,
			borderColor: theme.colors.primary,
		},
		user: {
			...pixelFrame(theme),
			position: 'absolute',
			left: '50%',
			bottom: 0,
			width: 18,
			height: 18,
			marginLeft: -9,
			backgroundColor: theme.colors.primary,
		},
	});
