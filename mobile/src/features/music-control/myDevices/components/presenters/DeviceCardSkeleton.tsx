import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { SkeletonBlock } from '@/shared/components/ui/Skeleton';

/** Same shape as a device card: icon, name and meta lines, then friend rows. */
export function DeviceCardSkeleton() {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.skeletonCard}>
			<View style={styles.deviceHeader}>
				<SkeletonBlock width={40} height={40} radius={20} style={styles.skeletonIcon} />
				<View style={styles.textContainer}>
					<SkeletonBlock width="55%" height={16} />
					<SkeletonBlock width="40%" height={12} style={styles.skeletonLine} />
				</View>
			</View>
			<View style={styles.divider} />
			{[0, 1].map(index => (
				<View key={index} style={styles.friendRow}>
					<SkeletonBlock width={32} height={32} radius={16} />
					<View style={styles.textContainer}>
						<SkeletonBlock width="45%" height={14} />
					</View>
					<SkeletonBlock width={51} height={31} radius={16} />
				</View>
			))}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		skeletonCard: {
			backgroundColor: theme.colors.surface,
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.md,
			paddingBottom: theme.spacing.xs,
			marginBottom: theme.spacing.lg,
		},
		deviceHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: theme.spacing.sm,
		},
		skeletonIcon: {
			marginRight: theme.spacing.md,
		},
		skeletonLine: {
			marginTop: 6,
		},
		textContainer: {
			flex: 1,
			marginRight: theme.spacing.sm,
		},
		divider: {
			height: 1,
			backgroundColor: theme.colors.border,
			marginVertical: theme.spacing.xs,
		},
		friendRow: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: theme.spacing.sm,
			gap: theme.spacing.md,
		},
	});
