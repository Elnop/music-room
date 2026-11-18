import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { Text } from '@/shared/components/ui/Text';
import { displayText } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const NOTE_SIZE = 216;

export function WelcomeLogo() {
	const { styles, theme } = useThemedStyles(createStyles);
	const shadowOffset = theme.borders.thick * 2;

	return (
		<View style={styles.stage} accessible accessibilityRole="header" accessibilityLabel="Zumik">
			<PixelIcon
				name="note"
				size={NOTE_SIZE}
				color={theme.colors.landingShadow}
				style={[styles.layer, { left: shadowOffset, top: shadowOffset }]}
			/>
			<PixelIcon name="note" size={NOTE_SIZE} color={theme.colors.primary} style={styles.layer} />
			<Text style={styles.word}>ZUMIK</Text>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		stage: {
			width: NOTE_SIZE,
			height: NOTE_SIZE,
			alignItems: 'center',
			justifyContent: 'center',
		},
		layer: { position: 'absolute', left: 0, top: 0 },
		word: {
			...displayText(theme, 54),
			color: theme.colors.text,
			textShadowColor: theme.colors.shadow,
			textShadowOffset: { width: 0, height: theme.borders.thick * 2 },
			textShadowRadius: 0,
		},
	});
