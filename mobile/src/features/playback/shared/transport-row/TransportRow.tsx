import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type TransportRowProps = {
	wide: boolean;
	children: React.ReactNode;
};

export function TransportRow({ wide, children }: TransportRowProps) {
	const { styles } = useThemedStyles(createStyles);
	return <View style={[styles.row, wide ? styles.wide : styles.compact]}>{children}</View>;
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
		},
		compact: { gap: theme.spacing.md },
		wide: { gap: theme.spacing.xl, paddingHorizontal: theme.spacing.xl },
	});
	return styles;
}
