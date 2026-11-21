import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import EyeCrossSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/eye-cross-solid.svg';
import EyeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/eye-solid.svg';

type PasswordToggleProps = {
	hidden: boolean;
	onToggle: () => void;
};

export function PasswordToggle({ hidden, onToggle }: PasswordToggleProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	return (
		<Pressable
			onPress={onToggle}
			accessibilityLabel={hidden ? 'Afficher le mot de passe' : 'Masquer le mot de passe'}
			hitSlop={8}
			style={[styles.toggle, Platform.OS === 'web' && styles.toggleWeb]}
		>
			<PixelIcon
				icon={hidden ? EyeSolid : EyeCrossSolid}
				size={20}
				color={theme.colors.textSecondary}
			/>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		toggle: {
			paddingHorizontal: theme.spacing.sm + 2,
			paddingVertical: theme.spacing.sm,
		},
		toggleWeb: {
			paddingHorizontal: theme.spacing.xs,
			paddingVertical: theme.spacing.xs,
			marginHorizontal: theme.spacing.xs + 2,
		},
	});
	return styles;
}
