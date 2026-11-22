import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { DeviceCardSkeletonHeader } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/DeviceCardSkeletonHeader';
import { DeviceCardSkeletonRow } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/DeviceCardSkeletonRow';

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		skeletonCard: {
			backgroundColor: theme.colors.surface,
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.md,
			paddingBottom: theme.spacing.xs,
			marginBottom: theme.spacing.lg,
		},
		divider: {
			height: theme.borders.hairline,
			backgroundColor: theme.colors.border,
			marginVertical: theme.spacing.xs,
		},
	});
	return styles;
}

export function DeviceCardSkeleton() {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.skeletonCard}>
			<DeviceCardSkeletonHeader />
			<View style={styles.divider} />
			{[0, 1].map((index) => (
				<DeviceCardSkeletonRow key={index} />
			))}
		</View>
	);
}
