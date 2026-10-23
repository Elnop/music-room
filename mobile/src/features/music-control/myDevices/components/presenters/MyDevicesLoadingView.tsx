import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { SkeletonList } from '@/shared/components/ui/Skeleton';
import { DeviceCardSkeleton } from './DeviceCardSkeleton';
import { MyDevicesHeader } from './MyDevicesHeader';

export function MyDevicesLoadingView() {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	return (
		<View style={styles.loadingScreen}>
			<MyDevicesHeader />
			<SkeletonList count={2} row={DeviceCardSkeleton} />
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		loadingScreen: {
			flex: 1,
			backgroundColor: theme.colors.background,
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.lg,
		},
	});
