import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import UserMinusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/user-minus-solid.svg';

type UserRemoveActionProps = {
	onRemove: () => void;
};

export function UserRemoveAction({ onRemove }: UserRemoveActionProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<Pressable style={styles.removeButton} onPress={onRemove} accessibilityLabel="Retirer">
			<PixelIcon icon={UserMinusSolid} size={24} color={theme.colors.onColor} />
			<Text style={styles.removeText}>Retirer</Text>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		removeButton: {
			backgroundColor: theme.colors.error,
			justifyContent: 'center',
			alignItems: 'center',
			width: theme.controls.swipeAction,
			height: '100%',
		},
		removeText: {
			color: theme.colors.onColor,
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			marginTop: theme.spacing.xs,
		},
	});
	return styles;
}
