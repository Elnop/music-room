import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Theme } from '@/shared/theme/types';
import { rowColumns } from '@/shared/utils/gridLayout';

/** List rows as they are on the phone, side by side as cards on wider screens. */
export function RowGrid({ children }: { children: React.ReactNode }) {
	const { styles } = useThemedStyles(createStyles);
	const columns = rowColumns(useBreakpoint().breakpoint);

	if (columns === 1) return <>{children}</>;

	return (
		<View style={styles.grid}>
			{React.Children.map(children, child => (
				<View style={[styles.cell, { width: `${100 / columns}%` }]}>
					<View style={styles.card}>{child}</View>
				</View>
			))}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		grid: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			paddingHorizontal: theme.spacing.sm,
		},
		cell: { padding: theme.spacing.xs },
		card: {
			flex: 1,
			justifyContent: 'center',
			borderRadius: 12,
			backgroundColor: theme.colors.surface,
		},
	});
