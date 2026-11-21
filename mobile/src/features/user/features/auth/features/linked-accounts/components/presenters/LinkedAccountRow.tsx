import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { IconTile } from '@/shared/theme/components/IconTile';
import { ProviderLinkAction } from '@/features/user/features/auth/features/linked-accounts/components/presenters/ProviderLinkAction';
import type { LinkedProvider } from '@/features/user/features/auth/authTypes';
import type {
	LinkActions,
	SignInMethod,
} from '@/features/user/features/auth/features/linked-accounts/linkedAccountsTypes';

type LinkedAccountRowProps = {
	method: SignInMethod;
	linked?: LinkedProvider;
	actions: LinkActions;
};

function linkStatus(linked: LinkedProvider | undefined): string {
	if (!linked) return 'Non lié';
	return linked.isPrimary ? 'Lié · Principal' : 'Lié';
}

export function LinkedAccountRow({ method, linked, actions }: LinkedAccountRowProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.accountItem} testID={`linked-account-${method.type}`}>
			<IconTile icon={method.icon} size="badge" />
			<View style={styles.methodInfo}>
				<Text style={styles.rowTitle}>{method.label}</Text>
				<Text style={styles.rowStatus}>{linkStatus(linked)}</Text>
			</View>
			{method.type !== 'password' && (
				<ProviderLinkAction provider={method.type} linked={Boolean(linked)} actions={actions} />
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		accountItem: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: theme.spacing.md,
		},
		methodInfo: {
			flex: 1,
		},
		rowTitle: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		rowStatus: {
			fontSize: theme.typography.sizes.smd,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xxs,
		},
	});
	return styles;
}
