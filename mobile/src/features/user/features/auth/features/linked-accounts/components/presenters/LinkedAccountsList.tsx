import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { LinkedAccountRow } from '@/features/user/features/auth/features/linked-accounts/components/presenters/LinkedAccountRow';
import { SIGN_IN_METHODS } from '@/features/user/features/auth/features/linked-accounts/linkedAccountsConfig';
import type { LinkedProvider } from '@/features/user/features/auth/authTypes';
import type { LinkActions } from '@/features/user/features/auth/features/linked-accounts/linkedAccountsTypes';

type LinkedAccountsListProps = {
	linkedProviders: LinkedProvider[];
	actions: LinkActions;
};

export function LinkedAccountsList({ linkedProviders, actions }: LinkedAccountsListProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.list}>
			{SIGN_IN_METHODS.map((method, index) => (
				<View key={method.type}>
					{index > 0 && <View style={styles.divider} />}
					<LinkedAccountRow
						method={method}
						linked={linkedProviders.find(provider => provider.type === method.type)}
						actions={actions}
					/>
				</View>
			))}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		list: {
			backgroundColor: theme.colors.surface,
			paddingHorizontal: theme.spacing.lg,
		},
		divider: {
			height: theme.borders.hairline,
			backgroundColor: theme.colors.border,
		},
	});
	return styles;
}
