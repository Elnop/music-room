import React from 'react';
import { StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import BracketSquareOutline from '@hackernoon/pixel-icon-library/icons/SVG/regular/bracket-square.svg';
import CheckBoxSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/check-box-solid.svg';

type PlaylistOptionProps = {
	name: string;
	selected: boolean;
	onSelect: () => void;
};

export function PlaylistOption({ name, selected, onSelect }: PlaylistOptionProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<Pressable
			style={[styles.option, selected && styles.selected]}
			onPress={onSelect}
			accessibilityRole="radio"
			accessibilityState={{ selected }}
			accessibilityLabel={`Playlist liée : ${name}`}
			haptic="selection"
		>
			<PixelIcon
				icon={selected ? CheckBoxSolid : BracketSquareOutline}
				size={18}
				color={selected ? theme.colors.primary : theme.colors.textSecondary}
			/>
			<Text style={styles.name} numberOfLines={1}>
				{name}
			</Text>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		option: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.sm,
			paddingVertical: theme.spacing.sm,
			paddingHorizontal: theme.spacing.md,
			backgroundColor: theme.colors.surface,
		},
		selected: { backgroundColor: theme.colors.surfaceAlt },
		name: { flex: 1, fontSize: theme.typography.sizes.md, color: theme.colors.text },
	});
	return styles;
}
