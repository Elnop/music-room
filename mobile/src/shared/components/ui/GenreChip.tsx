import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { Pressable } from '@/shared/components/ui/Pressable';
import { pixelFrame } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { MusicGenre } from '@/types/user.types';
import { GENRE_INFO } from '@/types/user.types';
import { Text } from './Text';

const SIZES = {
	sm: { padding: 6, fontSize: 12, icon: 12 },
	md: { padding: 8, fontSize: 14, icon: 18 },
	lg: { padding: 10, fontSize: 16, icon: 24 },
} as const;

interface GenreChipProps {
	genre: MusicGenre;
	selected?: boolean;
	disabled?: boolean;
	onPress?: () => void;
	size?: keyof typeof SIZES;
}

/** A genre as a pixel tile: its sprite and its name, filled with its colour once picked. */
export function GenreChip({
	genre,
	selected = false,
	disabled = false,
	onPress,
	size = 'md',
}: GenreChipProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const { label, color } = GENRE_INFO[genre];
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
			<PixelIcon name={genre} size={icon} color={ink} />
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

const createStyles = (theme: Theme) =>
	StyleSheet.create({
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
