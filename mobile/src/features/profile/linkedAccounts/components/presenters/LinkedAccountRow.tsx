import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type {
	GoogleButtonSlot,
	LinkedProvider,
	OAuthProvider,
} from '@/shared/services/linkedAccountsBridge';

type MethodType = LinkedProvider['type'];

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
	google: 'Google',
	facebook: 'Facebook',
};

interface LinkedAccountRowProps {
	method: {
		type: MethodType;
		label: string;
		icon: keyof typeof Ionicons.glyphMap;
	};
	linked?: LinkedProvider;
	pending: OAuthProvider | null;
	onLink: (provider: OAuthProvider) => void;
	onUnlink: (provider: OAuthProvider) => void;
	/** Web: linking Google starts from Google's own button. */
	googleButton?: GoogleButtonSlot;
}

export function LinkedAccountRow({
	method,
	linked,
	pending,
	onLink,
	onUnlink,
	googleButton,
}: LinkedAccountRowProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const isLinked = Boolean(linked);
	const type = method.type;

	const renderAction = () => {
		if (type === 'password') return null;

		const label = isLinked ? 'Délier' : 'Lier';
		const disabled = pending !== null;
		const onPress = () => (isLinked ? onUnlink(type) : onLink(type));

		if (googleButton && !isLinked && pending !== type) {
			return (
				<View
					ref={googleButton}
					style={disabled && styles.actionDisabled}
					testID="google-button-slot"
				/>
			);
		}

		return (
			<Pressable
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
			</Pressable>
		);
	};

	return (
		<View style={styles.accountItem} testID={`linked-account-${method.type}`}>
			<View style={styles.methodBadge}>
				<Ionicons name={method.icon} size={20} color={theme.colors.primary} />
			</View>
			<View style={styles.methodInfo}>
				<Text style={styles.rowTitle}>{method.label}</Text>
				<Text style={styles.rowStatus}>
					{linked ? (linked.isPrimary ? 'Lié · Principal' : 'Lié') : 'Non lié'}
				</Text>
			</View>
			{renderAction()}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		accountItem: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: theme.spacing.md,
		},
		methodBadge: {
			width: 40,
			height: 40,
			borderRadius: 20,
			backgroundColor: theme.colors.primary + '15',
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.md,
		},
		methodInfo: {
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
			pointerEvents: 'none',
		},
		actionText: {
			fontSize: 14,
			fontWeight: theme.typography.weights.semibold,
		},
		linkText: {
			color: theme.colors.textInverse,
		},
		unlinkText: {
			color: theme.colors.error,
		},
	});
