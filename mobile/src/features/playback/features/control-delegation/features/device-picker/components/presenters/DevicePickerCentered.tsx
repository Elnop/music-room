import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type DevicePickerCenteredProps = {
	children: ReactNode;
};

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		centered: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			padding: theme.spacing.lg,
			gap: theme.spacing.md,
		},
	});
	return styles;
}

export function DevicePickerCentered({ children }: DevicePickerCenteredProps) {
	const { styles } = useThemedStyles(createStyles);
	return <View style={styles.centered}>{children}</View>;
}
