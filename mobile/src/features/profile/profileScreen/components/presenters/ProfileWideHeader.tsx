import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/shared/components/media/Avatar';
import { Button } from '@/shared/components/ui/Button';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { UserProfile } from '@/types/user.types';
import type { UserStats } from '@/features/profile/types';
import { Text } from '@/shared/components/ui/Text';

interface ProfileWideHeaderProps {
	user: UserProfile;
	stats?: UserStats | null;
	onEditProfile: () => void;
	onSettings: () => void;
}

/** The profile's header on wide screens: the avatar beside the identity, the counts and the actions. */
export function ProfileWideHeader({
	user,
	stats,
	onEditProfile,
	onSettings,
}: ProfileWideHeaderProps) {
	const { theme, styles } = useThemedStyles(createStyles);
	const name = user.displayName || user.username;

	return (
		<View style={styles.container}>
			<Avatar size="xl" name={name} uri={user.avatarUrl} />
			<View style={styles.details}>
				<Text style={styles.kind}>Mon profil</Text>
				<Text style={styles.name} numberOfLines={2}>
					{name}
				</Text>
				<Text style={styles.username}>@{user.username}</Text>
				{!!user.bio && (
					<Text style={styles.bio} numberOfLines={3}>
						{user.bio}
					</Text>
				)}
				<View style={styles.stats}>
					<Text style={styles.stat}>
						<Text style={styles.statValue}>{stats?.followersCount ?? 0}</Text> Abonnés
					</Text>
					<Text style={styles.stat}>
						<Text style={styles.statValue}>{stats?.followingCount ?? 0}</Text> Abonnements
					</Text>
				</View>
				<View style={styles.actions}>
					<Button
						variant="secondary"
						onPress={onEditProfile}
						style={styles.action}
						icon={<Ionicons name="create-outline" size={18} color={theme.colors.text} />}
					>
						Modifier le profil
					</Button>
					<Button
						variant="secondary"
						onPress={onSettings}
						style={styles.action}
						icon={<Ionicons name="settings-outline" size={18} color={theme.colors.text} />}
					>
						Réglages
					</Button>
				</View>
			</View>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.lg,
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.xl,
			paddingBottom: theme.spacing.lg,
		},
		details: { flex: 1, minWidth: 0 },
		kind: {
			color: theme.colors.textSecondary,
			textTransform: 'uppercase',
			letterSpacing: 0.5,
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
		},
		name: {
			marginTop: theme.spacing.xs,
			color: theme.colors.text,
			fontFamily: theme.typography.families.extrabold,
			fontSize: theme.typography.sizes.xxxl,
		},
		username: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
		},
		bio: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.sm,
		},
		stats: {
			flexDirection: 'row',
			gap: theme.spacing.lg,
			marginTop: theme.spacing.sm,
		},
		stat: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
		},
		statValue: {
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		actions: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			gap: theme.spacing.sm,
			marginTop: theme.spacing.md,
		},
		action: { height: 40, paddingHorizontal: theme.spacing.md },
	});
