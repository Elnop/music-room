import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import type { LinkedProvider, OAuthProvider } from '@/types/auth.types';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@services/api';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { showError, showSuccess } from '@utils/toast';

type MethodType = LinkedProvider['type'];

interface MethodRow {
	type: MethodType;
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
}

const METHODS: MethodRow[] = [
	{ type: 'password', label: 'Email & password', icon: 'mail-outline' },
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

function errorMessage(error: unknown, fallback: string): string {
	return error instanceof ApiError ? error.message : fallback;
}

export function LinkedAccountsScreen() {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const linkedProviders = useAuthStore(state => state.linkedProviders);
	const fetchLinkedProviders = useAuthStore(state => state.fetchLinkedProviders);
	const linkProvider = useAuthStore(state => state.linkProvider);
	const unlinkProvider = useAuthStore(state => state.unlinkProvider);

	const [isLoading, setIsLoading] = useState(true);
	const [loadFailed, setLoadFailed] = useState(false);
	const [pending, setPending] = useState<OAuthProvider | null>(null);

	useEffect(() => {
		const load = async () => {
			try {
				setIsLoading(true);
				await fetchLinkedProviders();
				setLoadFailed(false);
			} catch (error) {
				setLoadFailed(true);
				showError(errorMessage(error, 'Unable to load linked accounts'));
			} finally {
				setIsLoading(false);
			}
		};

		load();
	}, [fetchLinkedProviders]);

	const handleLink = useCallback(
		async (provider: OAuthProvider) => {
			setPending(provider);
			try {
				await linkProvider(provider);
				showSuccess(`${PROVIDER_LABELS[provider]} linked`);
			} catch (error) {
				if (!isCancelled(error)) {
					showError(errorMessage(error, `Unable to link ${PROVIDER_LABELS[provider]}`));
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
				showSuccess(`${PROVIDER_LABELS[provider]} unlinked`);
			} catch (error) {
				showError(errorMessage(error, `Unable to unlink ${PROVIDER_LABELS[provider]}`));
			} finally {
				setPending(null);
			}
		},
		[unlinkProvider]
	);

	if (isLoading) {
		return <LoadingSpinner fullScreen message="Loading..." />;
	}

	if (loadFailed || !linkedProviders) {
		return (
			<View style={styles.container}>
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>Unable to load linked accounts</Text>
				</View>
			</View>
		);
	}

	const renderAction = (type: MethodType, isLinked: boolean) => {
		if (type === 'password') return null;

		const label = isLinked ? 'Unlink' : 'Link';
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
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
				<View style={styles.header}>
					<Text style={styles.title}>Linked accounts</Text>
					<Text style={styles.subtitle}>Choose how you sign in to Zumik</Text>
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
											{linked ? (linked.isPrimary ? 'Linked · Primary' : 'Linked') : 'Not linked'}
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
		title: {
			fontSize: 28,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xs,
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
