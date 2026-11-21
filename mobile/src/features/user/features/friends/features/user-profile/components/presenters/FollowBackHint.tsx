import React from 'react';
import { StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';
import type { FollowStatus } from '@/features/user/features/friends/friendsTypes';

type FollowBackHintProps = {
	followStatus: FollowStatus | null;
};

export function FollowBackHint({ followStatus }: FollowBackHintProps) {
	const { styles } = useThemedStyles(createStyles);

	if (!followStatus?.isFollowedBy || followStatus.isFollowing) return null;
	return (
		<Text style={styles.followBackHint}>Suivez cet utilisateur en retour pour devenir amis.</Text>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		followBackHint: {
			fontSize: theme.typography.sizes.smd,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xs,
		},
	});
	return styles;
}
