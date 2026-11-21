import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import { GENRE_INFO } from '@/shared/theme/configs/genresConfig';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { GenreChipSize } from '@/shared/theme/types/genreChipTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { MusicGenre } from '@/shared/users/userTypes';

const SIZES = {
	sm: { padding: 6, fontSize: 12, icon: 12 },
	md: { padding: 8, fontSize: 14, icon: 18 },
	lg: { padding: 10, fontSize: 16, icon: 24 },
} as const;

type GenreChipBodyProps = {
	genre: MusicGenre;
	selected: boolean;
	disabled: boolean;
	size: GenreChipSize;
};

function chipSizeStyle(padding: number): ViewStyle {
	return { padding, paddingHorizontal: padding * 1.5 };
}

function backgroundStyle(color: string): ViewStyle {
	return { backgroundColor: color };
}

function fontSizeStyle(fontSize: number): TextStyle {
	return { fontSize };
}

export function GenreChipBody({ genre, selected, disabled, size }: GenreChipBodyProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const info = GENRE_INFO[genre];
	const metrics = SIZES[size];
	const ink = selected ? theme.colors.onColor : info.color;

	return (
		<View
			style={[
				styles.chip,
				chipSizeStyle(metrics.padding),
				selected && backgroundStyle(info.color),
				disabled && styles.disabled,
			]}
		>
			<PixelIcon icon={info.icon} size={metrics.icon} color={ink} />
			<Text
				style={[styles.label, fontSizeStyle(metrics.fontSize), selected && styles.labelSelected]}
			>
				{info.label}
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		chip: {
			...pixelFrame(theme),
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.xs,
			backgroundColor: theme.colors.surfaceAlt,
		},
		disabled: { opacity: 0.5 },
		label: { color: theme.colors.text, fontFamily: theme.typography.families.medium },
		labelSelected: { color: theme.colors.onColor, fontFamily: theme.typography.families.semibold },
	});
	return styles;
}
