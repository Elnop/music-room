import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerHeight } from '@/features/player/context/PlayerContext';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type { LinkedProvider, OAuthProvider } from '@/features/auth/types';
import {
	useLinkedProviders,
	useLinkProvider,
	useUnlinkProvider,
} from '@/features/auth/hooks/useLinkedProviders';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { showError, showSuccess } from '@/shared/utils/toast';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';

type MethodType = LinkedProvider['type'];

interface MethodRow {
	type: MethodType;
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
}

const METHODS: MethodRow[] = [
	{ type: 'password', label: 'Email et mot de passe', icon: 'mail-outline' },
	{ type: 'google', label: 'Google', icon: 'logo-google' },
	{ type: 'facebook', label: 'Facebook', icon: 'logo-facebook' },
];

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
	google: 'Google',
	facebook: 'Facebook',
};

function isCancelled(error: unknown): boolean {
	return error instanceof Error && error.message === 'SIGN_IN_CANCELLED';
}

export function LinkedAccountsScreen() {
	const { theme } = useTheme();
	const playerHeight = usePlayerHeight();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const providersQuery = useLinkedProviders();
	const linkedProviders = providersQuery.data;
	const linkProvider = useLinkProvider().mutateAsync;
	const unlinkProvider = useUnlinkProvider().mutateAsync;

	const [pending, setPending] = useState<OAuthProvider | null>(null);

	// Only a failure of a fetch made since this visit: a cached error is not replayed.
	const { error: loadError, errorUpdatedAt, isFetchedAfterMount } = providersQuery;
	useEffect(() => {
		if (loadError && isFetchedAfterMount) {
			showError(apiErrorMessage(loadError, 'Impossible de charger les comptes liés'));
		}
		// errorUpdatedAt changes with each failure, even with an equal error.
	}, [loadError, errorUpdatedAt, isFetchedAfterMount]);

	const handleLink = useCallback(
		async (provider: OAuthProvider) => {
			setPending(provider);
			try {
				await linkProvider(provider);
				showSuccess(`Compte ${PROVIDER_LABELS[provider]} lié`);
			} catch (error) {
				if (!isCancelled(error)) {
					showError(
						apiErrorMessage(error, `Impossible de lier le compte ${PROVIDER_LABELS[provider]}`)
					);
				}
			} finally {
				setPending(null);
			}
		},
		[linkProvider]
	);

	const handleUnlink = useCallback(
		async (provider: OAuthProvider) => {
			setPending(provider);
			try {
				await unlinkProvider(provider);
				showSuccess(`Compte ${PROVIDER_LABELS[provider]} délié`);
			} catch (error) {
				showError(
					apiErrorMessage(error, `Impossible de délier le compte ${PROVIDER_LABELS[provider]}`)
				);
			} finally {
				setPending(null);
			}
		},
		[unlinkProvider]
	);

	if (providersQuery.isLoading) {
		return <LoadingSpinner fullScreen message="Chargement…" />;
	}

	// A failed refetch keeps the list on screen; the error screen needs no data.
	if (!linkedProviders) {
		return (
			<View style={styles.container}>
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>Impossible de charger les comptes liés</Text>
				</View>
			</View>
		);
	}

	const renderAction = (type: MethodType, isLinked: boolean) => {
		if (type === 'password') return null;

		const label = isLinked ? 'Délier' : 'Lier';
		const disabled = pending !== null;
		const onPress = () => (isLinked ? handleUnlink(type) : handleLink(type));

		return (
			<TouchableOpacity
				style={[
					styles.actionButton,
					isLinked ? styles.unlinkButton : styles.linkButton,
					disabled && styles.actionDisabled,
				]}
				onPress={onPress}
				disabled={disabled}
				accessibilityRole="button"
				accessibilityLabel={`${label} ${PROVIDER_LABELS[type]}`}
				accessibilityState={{ disabled, busy: pending === type }}
			>
				<Text style={[styles.actionText, isLinked ? styles.unlinkText : styles.linkText]}>
					{pending === type ? '...' : label}
				</Text>
			</TouchableOpacity>
		);
	};

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={[styles.content, { paddingBottom: playerHeight + theme.spacing.xl }]}
			>
				<View style={styles.header}>
					<Text style={styles.subtitle}>Choisissez comment vous connecter à Zumik</Text>
				</View>

				<View style={styles.list}>
					{METHODS.map((method, index) => {
						const linked = linkedProviders.find(p => p.type === method.type);
						return (
							<View key={method.type}>
								{index > 0 && <View style={styles.divider} />}
								<View style={styles.row} testID={`linked-account-${method.type}`}>
									<View style={styles.iconContainer}>
										<Ionicons name={method.icon} size={20} color={theme.colors.primary} />
									</View>
									<View style={styles.textContainer}>
										<Text style={styles.rowTitle}>{method.label}</Text>
										<Text style={styles.rowStatus}>
											{linked ? (linked.isPrimary ? 'Lié · Principal' : 'Lié') : 'Non lié'}
										</Text>
									</View>
									{renderAction(method.type, Boolean(linked))}
								</View>
							</View>
						);
					})}
				</View>
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
		list: {
			backgroundColor: theme.colors.surface,
			borderRadius: 16,
			paddingHorizontal: theme.spacing.lg,
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: theme.spacing.md,
		},
		divider: {
			height: 1,
			backgroundColor: theme.colors.border,
		},
		iconContainer: {
			width: 40,
			height: 40,
			borderRadius: 20,
			backgroundColor: theme.colors.primary + '15',
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.md,
		},
		textContainer: {
			flex: 1,
		},
		rowTitle: {
			fontSize: 16,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.text,
		},
		rowStatus: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		actionButton: {
			paddingVertical: theme.spacing.xs,
			paddingHorizontal: theme.spacing.md,
			borderRadius: 12,
			borderWidth: 1,
			minWidth: 72,
			alignItems: 'center',
		},
		linkButton: {
			borderColor: theme.colors.primary,
			backgroundColor: theme.colors.primary,
		},
		unlinkButton: {
			borderColor: theme.colors.error,
			backgroundColor: 'transparent',
		},
		actionDisabled: {
			opacity: 0.5,
		},
		actionText: {
			fontSize: 14,
			fontWeight: theme.typography.weights.semibold,
		},
		linkText: {
			color: '#FFFFFF',
		},
		unlinkText: {
			color: theme.colors.error,
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
