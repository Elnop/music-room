import React from 'react';
import { StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import ArrowRightSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/arrow-right-solid.svg';

const NEXT_HIT_SLOP = { top: 10, bottom: 10, left: 6, right: 10 };

type MiniPlayerNextButtonProps = {
	disabled: boolean;
	onPress: () => void;
};

export function MiniPlayerNextButton({ disabled, onPress }: MiniPlayerNextButtonProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<Pressable
			style={[styles.nextButton, disabled && styles.disabledIcon]}
			onPress={onPress}
			hitSlop={NEXT_HIT_SLOP}
			disabled={disabled}
			accessibilityRole="button"
			accessibilityLabel="Piste suivante"
			accessibilityState={{ disabled }}
		>
			<PixelIcon icon={ArrowRightSolid} color={theme.colors.text} />
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		nextButton: {
			width: theme.controls.iconButtonLarge,
			height: theme.controls.iconButtonXl,
			marginLeft: theme.spacing.xs,
			alignItems: 'center',
			justifyContent: 'center',
		},
		disabledIcon: { opacity: 0.35 },
	});
	return styles;
}
