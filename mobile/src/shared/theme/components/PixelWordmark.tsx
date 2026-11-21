import React from 'react';
import { StyleSheet } from 'react-native';
import type { TextStyle } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';

type PixelWordmarkProps = {
	size?: number;
};

function fontSizeStyle(size: number): TextStyle {
	return { fontSize: size };
}

export function PixelWordmark({ size = 24 }: PixelWordmarkProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<Text
			style={[styles.word, fontSizeStyle(size)]}
			accessibilityRole="header"
			accessibilityLabel="Zumik"
		>
			ZUMIK
		</Text>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		word: {
			fontFamily: theme.typography.families.mono,
			color: theme.colors.primary,
			textShadowColor: theme.colors.shadow,
			textShadowOffset: { width: theme.borders.thick, height: theme.borders.thick },
			textShadowRadius: 0,
		},
	});
	return styles;
}
