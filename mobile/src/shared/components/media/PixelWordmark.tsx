import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from '@/shared/components/ui/Text';
import { useLoop } from '@/shared/hooks/useLoop';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

/** « ZUMIK » in pixel capitals, followed by a blinking text cursor. */
export function PixelWordmark({ size = 24 }: { size?: number }) {
	const { styles, theme } = useThemedStyles(createStyles);
	const blink = useLoop(true, 1000).interpolate({
		inputRange: [0, 0.5, 0.51, 1],
		outputRange: [1, 1, 0, 0],
	});
	const shadow = { width: theme.borders.thick, height: theme.borders.thick };

	return (
		<View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="Zumik">
			<Text style={[styles.word, { fontSize: size, textShadowOffset: shadow }]}>ZUMIK</Text>
			<Animated.View
				style={[
					styles.cursor,
					{ width: size / 2, height: size * 0.9, opacity: blink },
					theme.shadows.small,
				]}
			/>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		row: { flexDirection: 'row', alignItems: 'center', gap: theme.borders.thick },
		word: {
			fontFamily: theme.typography.families.mono,
			color: theme.colors.primary,
			textShadowColor: theme.colors.shadow,
			textShadowRadius: 0,
		},
		cursor: { backgroundColor: theme.colors.primary },
	});
