import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';

interface ProfileScreenLayoutProps {
	subtitle?: string;
	playerHeight: number;
	isLoading?: boolean;
	errorMessage?: string | null;
	children?: React.ReactNode;
}

export function ProfileScreenLayout({
	subtitle,
	playerHeight,
	isLoading,
	errorMessage,
	children,
}: ProfileScreenLayoutProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	if (isLoading) {
		return <LoadingSpinner fullScreen message="Chargement…" />;
	}

	if (errorMessage) {
		return (
			<View style={styles.container}>
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>{errorMessage}</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={[styles.content, { paddingBottom: playerHeight + theme.spacing.xl }]}
			>
				{subtitle && (
					<View style={styles.header}>
						<Text style={styles.subtitle}>{subtitle}</Text>
					</View>
				)}
				{children}
			</ScrollView>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
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
		header: {
			marginBottom: theme.spacing.xl,
		},
		subtitle: {
			fontSize: 16,
			color: theme.colors.textSecondary,
		},
		errorContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			padding: theme.spacing.xl,
		},
		errorText: {
			fontSize: 16,
			color: theme.colors.error,
			textAlign: 'center',
		},
	});
