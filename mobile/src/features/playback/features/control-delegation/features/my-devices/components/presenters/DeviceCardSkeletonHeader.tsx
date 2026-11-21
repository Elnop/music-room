import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { SkeletonBlock } from '@/shared/theme/components/Skeleton';

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		deviceHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: theme.spacing.sm,
		},
		skeletonIcon: { marginRight: theme.spacing.md },
		skeletonLine: { marginTop: theme.spacing.xsm },
		textContainer: { flex: 1, marginRight: theme.spacing.sm },
	});
	return styles;
}

export function DeviceCardSkeletonHeader() {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.deviceHeader}>
			<SkeletonBlock width={40} height={40} radius={20} style={styles.skeletonIcon} />
			<View style={styles.textContainer}>
				<SkeletonBlock width="55%" height={16} />
				<SkeletonBlock width="40%" height={12} style={styles.skeletonLine} />
			</View>
		</View>
	);
}
