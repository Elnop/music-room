import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type UserRoleBadgeProps = {
	role: 'collaborator' | 'viewer';
};

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
	const { styles } = useThemedStyles(createStyles);
	const collaborator = role === 'collaborator';

	return (
		<View style={[styles.roleBadge, collaborator ? styles.collaborator : styles.viewer]}>
			<Text style={styles.roleText}>{collaborator ? 'Collaborateur' : 'Lecteur'}</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		roleBadge: {
			paddingHorizontal: theme.spacing.sml,
			paddingVertical: theme.spacing.xs,
		},
		collaborator: {
			backgroundColor: theme.colors.primary + '30',
		},
		viewer: {
			backgroundColor: theme.colors.border,
		},
		roleText: {
			fontSize: theme.typography.sizes.xsm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
	});
	return styles;
}
