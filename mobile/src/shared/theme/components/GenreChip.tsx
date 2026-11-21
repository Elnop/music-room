import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { MusicGenre } from '@/shared/users/user.types';
import { GENRE_INFO } from '@/shared/theme/lib/genres';
import { Text } from '@/shared/theme/components/Text';

const SIZES = {
	sm: { padding: 6, fontSize: 12, icon: 12 },
	md: { padding: 8, fontSize: 14, icon: 18 },
	lg: { padding: 10, fontSize: 16, icon: 24 },
} as const;

type GenreChipProps = {
	genre: MusicGenre;
	selected?: boolean;
	disabled?: boolean;
	onPress?: () => void;
	size?: keyof typeof SIZES;
};

export function GenreChip({
	genre,
	selected = false,
	disabled = false,
	onPress,
	size = 'md',
}: GenreChipProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const { label, color, icon: genreIcon } = GENRE_INFO[genre];
	const ink = selected ? theme.colors.onColor : color;
	const { padding, fontSize, icon } = SIZES[size];

	const content = (
		<View
			style={[
				styles.chip,
				{ padding, paddingHorizontal: padding * 1.5 },
				selected && { backgroundColor: color },
				disabled && styles.disabled,
			]}
		>
			<PixelIcon icon={genreIcon} size={icon} color={ink} />
			<Text style={[styles.label, { fontSize }, selected && styles.labelSelected]}>{label}</Text>
		</View>
	);

	if (onPress && !disabled) {
		return (
			<Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
				{content}
			</Pressable>
		);
	}

	return content;
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
