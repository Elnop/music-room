import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type { MusicGenre } from '@/types/user.types';
import { GENRE_INFO } from '@/types/user.types';

interface GenreChipProps {
	genre: MusicGenre;
	selected?: boolean;
	disabled?: boolean;
	onPress?: () => void;
	size?: 'sm' | 'md' | 'lg';
}

export function GenreChip({
	genre,
	selected = false,
	disabled = false,
	onPress,
	size = 'md',
}: GenreChipProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme, size), [theme, size]);
	const genreInfo = GENRE_INFO[genre];

	const chipStyle = [
		styles.chip,
		selected && styles.chipSelected,
		selected && { backgroundColor: genreInfo.color },
		disabled && styles.chipDisabled,
	];

	const textStyle = [
		styles.label,
		selected && styles.labelSelected,
		disabled && styles.labelDisabled,
	];

	const content = (
		<View style={chipStyle}>
			<Text style={styles.icon}>{genreInfo.icon}</Text>
			<Text style={textStyle}>{genreInfo.label}</Text>
		</View>
	);

	if (onPress && !disabled) {
		return (
			<Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={genreInfo.label}>
				{content}
			</Pressable>
		);
	}

	return content;
}

const createStyles = (theme: Theme, size: 'sm' | 'md' | 'lg') => {
	const sizeMap = {
		sm: { paddingH: 10, paddingV: 6, fontSize: 12, iconSize: 14 },
		md: { paddingH: 14, paddingV: 8, fontSize: 14, iconSize: 16 },
		lg: { paddingH: 18, paddingV: 10, fontSize: 16, iconSize: 20 },
	};

	const s = sizeMap[size];

	return StyleSheet.create({
		chip: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: s.paddingH,
			paddingVertical: s.paddingV,
			backgroundColor: theme.colors.surface,
			borderRadius: 20,
			borderWidth: 1,
			borderColor: theme.colors.border,
		},
		chipSelected: {
			borderColor: 'transparent',
		},
		chipDisabled: {
			opacity: 0.5,
		},
		icon: {
			fontSize: s.iconSize,
			marginRight: theme.spacing.xs,
		},
		label: {
			fontSize: s.fontSize,
			color: theme.colors.text,
			fontWeight: theme.typography.weights.medium,
		},
		labelSelected: {
			color: theme.colors.onColor,
			fontWeight: theme.typography.weights.semibold,
		},
		labelDisabled: {
			color: theme.colors.textSecondary,
		},
	});
};
