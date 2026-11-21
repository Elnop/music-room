import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/shared/theme/components/Avatar';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { displayText } from '@/shared/theme/lib/pixelFrame';
import type { UserProfile } from '@/shared/users/userTypes';
import type { UserStats } from '@/features/user/features/profile/types';
import { Text } from '@/shared/theme/components/Text';

type ProfileHeaderProps = {
	user: UserProfile;
	stats?: UserStats | null;
};

export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.heroContent}>
			<Avatar size="lg" name={user.displayName || user.username} uri={user.avatarUrl} />

			<Text style={styles.username}>@{user.username}</Text>

			{user.displayName && <Text style={styles.displayName}>{user.displayName}</Text>}

			{user.bio && <Text style={styles.bio}>{user.bio}</Text>}

			<View style={styles.statsRow}>
				<View style={styles.statItem}>
					<Text style={styles.statValue}>{stats?.followersCount ?? 0}</Text>
					<Text style={styles.statLabel}>Abonnés</Text>
				</View>
				<View style={styles.statDivider} />
				<View style={styles.statItem}>
					<Text style={styles.statValue}>{stats?.followingCount ?? 0}</Text>
					<Text style={styles.statLabel}>Abonnements</Text>
				</View>
			</View>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		heroContent: {
			alignItems: 'center',
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.lg,
			paddingBottom: theme.spacing.xl,
		},
		username: {
			fontSize: 14,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.md,
		},
		displayName: {
			...displayText(theme, 26),
			color: theme.colors.text,
			marginTop: theme.spacing.xs,
		},
		bio: {
			fontSize: 15,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.sm,
			textAlign: 'center',
			lineHeight: 22,
			maxWidth: '80%',
		},
		statsRow: {
			flexDirection: 'row',
			alignItems: 'center',
			marginTop: theme.spacing.lg,
			backgroundColor: theme.colors.surface,
			paddingVertical: theme.spacing.md,
			paddingHorizontal: theme.spacing.xl,
		},
		statItem: {
			alignItems: 'center',
			paddingHorizontal: theme.spacing.lg,
		},
		statValue: {
			fontSize: 18,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		statLabel: {
			fontSize: 12,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		statDivider: {
			width: 1,
			height: 30,
			backgroundColor: theme.colors.border,
		},
	});
	return styles;
}
