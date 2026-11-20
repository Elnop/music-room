import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from './Text';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';

export function PixelWordmark({ size = 24 }: { size?: number }) {
	const { styles, theme } = useThemedStyles(createStyles);
	const shadow = { width: theme.borders.thick, height: theme.borders.thick };

	return (
		<Text
			style={[styles.word, { fontSize: size, textShadowOffset: shadow }]}
			accessibilityRole="header"
			accessibilityLabel="Zumik"
		>
			ZUMIK
		</Text>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		word: {
			fontFamily: theme.typography.families.mono,
			color: theme.colors.primary,
			textShadowColor: theme.colors.shadow,
			textShadowRadius: 0,
		},
	});
