import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { GoogleButtonSlot } from '@/features/user/features/auth/authTypes';

type GoogleRenderedButtonProps = {
	slot: GoogleButtonSlot;
	disabled: boolean;
};

export function GoogleRenderedButton({ slot, disabled }: GoogleRenderedButtonProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View
			ref={slot}
			style={[styles.slot, disabled && styles.disabled]}
			testID="google-button-slot"
		/>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		slot: {
			alignItems: 'center',
			minHeight: theme.controls.touchTarget,
		},
		disabled: {
			opacity: 0.5,
			pointerEvents: 'none',
		},
	});
	return styles;
}
