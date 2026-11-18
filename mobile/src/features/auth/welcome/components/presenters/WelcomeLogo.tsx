import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { Text } from '@/shared/components/ui/Text';
import { displayText } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const NOTE_SIZE = 400;

export function WelcomeLogo() {
	const { styles, theme } = useThemedStyles(createStyles);
	const shadowOffset = theme.borders.thick * 2;
	const stroke = theme.borders.thick;
	const outline = [
		{ left: -stroke, top: 0 },
		{ left: stroke, top: 0 },
		{ left: 0, top: -stroke },
		{ left: -stroke, top: shadowOffset },
		{ left: stroke, top: shadowOffset },
		{ left: 0, top: shadowOffset + stroke },
	];

	return (
		<View style={styles.stage} accessible accessibilityRole="header" accessibilityLabel="Zumik">
			<PixelIcon
				name="note"
				size={NOTE_SIZE}
				color={theme.colors.landingShadow}
				style={[styles.layer, { left: shadowOffset, top: shadowOffset }]}
			/>
			<PixelIcon name="note" size={NOTE_SIZE} color={theme.colors.primary} style={styles.layer} />
			<View>
				{outline.map(offset => (
					<Text key={`${offset.left}:${offset.top}`} style={[styles.word, styles.wordShadow, offset]}>
						ZUMIK
					</Text>
				))}
				<Text style={styles.word}>ZUMIK</Text>
			</View>
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
			...displayText(theme, 66),
			letterSpacing: 6,
			color: theme.colors.text,
		},
		wordShadow: { position: 'absolute', left: 0, color: theme.colors.shadow },
	});
