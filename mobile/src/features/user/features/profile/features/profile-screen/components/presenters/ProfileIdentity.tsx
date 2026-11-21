import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { displayText } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { UserProfile } from '@/shared/users/userTypes';

type ProfileIdentityProps = {
	user: UserProfile;
};

export function ProfileIdentity({ user }: ProfileIdentityProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<>
			<Text style={styles.username}>@{user.username}</Text>

			{user.displayName && <Text style={styles.displayName}>{user.displayName}</Text>}

			{user.bio && <Text style={styles.bio}>{user.bio}</Text>}
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		username: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.md,
		},
		displayName: {
			...displayText(theme, 26),
			color: theme.colors.text,
			marginTop: theme.spacing.xs,
		},
		bio: {
			fontSize: theme.typography.sizes.mlg,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.sm,
			textAlign: 'center',
			lineHeight: theme.typography.lineHeights.relaxed,
			maxWidth: '80%',
		},
	});
	return styles;
}
