import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { rowColumns } from '@/shared/theme/lib/gridLayout';

type RowGridProps = {
	children: React.ReactNode;
};

function cellWidth(columns: number): ViewStyle {
	return { width: `${100 / columns}%` };
}

export function RowGrid({ children }: RowGridProps) {
	const { styles } = useThemedStyles(createStyles);
	const columns = rowColumns(useBreakpoint().breakpoint);

	if (columns === 1) return <>{children}</>;

	return (
		<View style={styles.grid}>
			{React.Children.map(children, child => (
				<View style={[styles.cell, cellWidth(columns)]}>
					<View style={styles.card}>{child}</View>
				</View>
			))}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		grid: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			paddingHorizontal: theme.spacing.sm,
		},
		cell: { padding: theme.spacing.xs },
		card: {
			flex: 1,
			justifyContent: 'center',
			backgroundColor: theme.colors.surface,
		},
	});
	return styles;
}
