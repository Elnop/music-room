import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import type { RefreshControlProps } from 'react-native';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';
import { LOAD_ERROR } from '@/features/playback/features/control-delegation/features/my-devices/myDevicesConfig';

type MyDevicesErrorViewProps = {
	refreshControl: React.ReactElement<RefreshControlProps>;
};

export function MyDevicesErrorView({ refreshControl }: MyDevicesErrorViewProps) {
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

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		errorScreen: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		errorCenter: {
			flex: 1,
			alignItems: 'center',
			justifyContent: 'center',
			padding: theme.spacing.lg,
		},
		errorMessage: {
			color: theme.colors.textSecondary,
			fontSize: theme.typography.sizes.lg,
			textAlign: 'center',
		},
	});
	return styles;
}
