import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types';

export const createUserProfileStyles = (theme: Theme) =>
	StyleSheet.create({
		shareButton: {
			alignSelf: 'flex-start',
			marginTop: theme.spacing.md,
		},
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		scrollView: {
			flex: 1,
		},
		contentContainer: {
			paddingBottom: theme.spacing.xl,
		},
		header: {
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.md,
		},
		playlistsSection: {
			paddingTop: theme.spacing.lg,
			marginTop: theme.spacing.md,
		},
		sectionTitle: {
			fontSize: 18,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.text,
			marginBottom: theme.spacing.md,
			paddingHorizontal: theme.spacing.md,
		},
		emptyPlaylists: {
			flex: 0,
			padding: theme.spacing.lg,
		},
		infoSection: {
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.lg,
			marginTop: theme.spacing.md,
		},
		infoText: {
			fontSize: 13,
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
