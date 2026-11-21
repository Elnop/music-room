import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { SkeletonList } from '@/shared/theme/components/Skeleton';
import { DeviceCardSkeleton } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/DeviceCardSkeleton';
import { MyDevicesHeader } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/MyDevicesHeader';

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

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		loadingScreen: {
			flex: 1,
			backgroundColor: theme.colors.background,
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.lg,
		},
	});
	return styles;
}
