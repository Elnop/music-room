import React from 'react';
import { View, Text, StyleSheet, ScrollView, type RefreshControlProps } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { SkeletonList } from '@/shared/components/ui/Skeleton';
import { DeviceCardSkeleton } from './DeviceCardSkeleton';

const LOAD_ERROR = 'Impossible de charger vos appareils';

export function MyDevicesHeader() {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	return (
		<View style={styles.headerBlock}>
			<Text style={styles.headerDesc}>
				Choisissez quels amis peuvent contrôler la musique de chaque appareil
			</Text>
		</View>
	);
}

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

export function MyDevicesErrorView({
	refreshControl,
}: {
	refreshControl: React.ReactElement<RefreshControlProps>;
}) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	return (
		<ScrollView
			style={styles.errorScreen}
			contentContainerStyle={styles.errorCenter}
			refreshControl={refreshControl}
		>
			<Text style={styles.errorMessage}>{LOAD_ERROR}</Text>
		</ScrollView>
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
		errorScreen: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		errorCenter: {
			flexGrow: 1,
			alignItems: 'center',
			justifyContent: 'center',
			padding: theme.spacing.xl,
		},
		errorMessage: {
			fontSize: 16,
			color: theme.colors.error,
			textAlign: 'center',
		},
		headerBlock: {
			marginBottom: theme.spacing.lg,
		},
		headerDesc: {
			fontSize: 15,
			lineHeight: 22,
			color: theme.colors.textSecondary,
		},
	});
