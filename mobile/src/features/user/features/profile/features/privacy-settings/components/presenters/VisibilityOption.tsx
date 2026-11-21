import React from 'react';
import { StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { VisibilityLevel } from '@/shared/users/userTypes';
import { VISIBILITY_LABELS } from '@/shared/users/userConfig';
import { VISIBILITY_ICONS } from '@/shared/theme/configs/genresConfig';
import { Text } from '@/shared/theme/components/Text';

type VisibilityOptionProps = {
	option: VisibilityLevel;
	isSelected: boolean;
	onSelect: (value: VisibilityLevel) => void;
};

export function VisibilityOption({ option, isSelected, onSelect }: VisibilityOptionProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<Pressable
			style={[styles.option, isSelected && styles.optionSelected]}
			onPress={() => onSelect(option)}
			accessibilityLabel={VISIBILITY_LABELS[option]}
		>
			<PixelIcon
				icon={VISIBILITY_ICONS[option]}
				size={14}
				color={isSelected ? theme.colors.textInverse : theme.colors.textSecondary}
			/>
			<Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
				{VISIBILITY_LABELS[option]}
			</Text>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		option: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			paddingVertical: theme.spacing.sm + theme.spacing.xxs,
			paddingHorizontal: theme.spacing.sm,
			gap: theme.spacing.xs,
		},
		optionSelected: {
			backgroundColor: theme.colors.primary,
		},
		optionLabel: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.textSecondary,
		},
		optionLabelSelected: {
			color: theme.colors.textInverse,
		},
	});
	return styles;
}
