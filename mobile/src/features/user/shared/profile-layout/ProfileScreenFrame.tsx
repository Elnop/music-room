import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { bottomPaddingStyle } from '@/features/user/shared/profile-layout/bottomPaddingStyle';
import { LoadingSpinner } from '@/shared/theme/components/LoadingSpinner';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';

type ProfileScreenFrameProps = {
	subtitle?: string;
	bottomPadding: number;
	isLoading?: boolean;
	errorMessage?: string | null;
	children?: React.ReactNode;
};

export function ProfileScreenFrame(props: ProfileScreenFrameProps) {
	const { styles } = useThemedStyles(createStyles);
	const { styles: errorStyles } = useThemedStyles(createErrorStyles);

	if (props.isLoading) {
		return <LoadingSpinner fullScreen message="Chargement…" />;
	}

	if (props.errorMessage) {
		return (
			<View style={[styles.container, errorStyles.errorContainer]}>
				<Text style={errorStyles.errorText}>{props.errorMessage}</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={[styles.content, bottomPaddingStyle(props.bottomPadding)]}
			>
				{props.subtitle && <Text style={styles.subtitle}>{props.subtitle}</Text>}
				{props.children}
			</ScrollView>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		scrollView: {
			flex: 1,
		},
		content: {
			padding: theme.spacing.lg,
		},
		subtitle: {
			marginBottom: theme.spacing.xl,
			fontSize: theme.typography.sizes.lg,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}

function createErrorStyles(theme: Theme) {
	const errorStyles = StyleSheet.create({
		errorContainer: {
			justifyContent: 'center',
			alignItems: 'center',
			padding: theme.spacing.xl,
		},
		errorText: {
			fontSize: theme.typography.sizes.lg,
			color: theme.colors.error,
			textAlign: 'center',
		},
	});
	return errorStyles;
}
