import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NameWithHandle } from '@/shared/theme/components/NameWithHandle';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type UserIdentityProps = {
	username: string;
	displayName?: string | null;
};

export function UserIdentity({ username, displayName }: UserIdentityProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.userInfo}>
			<NameWithHandle name={displayName || username} username={username} size="large" />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		userInfo: {
			flex: 1,
			marginRight: theme.spacing.sm,
		},
	});
	return styles;
}
