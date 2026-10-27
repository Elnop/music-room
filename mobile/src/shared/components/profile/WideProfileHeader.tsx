import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Avatar } from '@/shared/components/media/Avatar';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Text } from '@/shared/components/ui/Text';

interface WideProfileHeaderProps {
	/** The line above the name: whose profile this is. */
	kind: string;
	name: string;
	username: string;
	avatarUrl?: string;
	bio?: string;
	followersCount: number;
	followingCount: number;
	/** Beside the username. */
	badges?: React.ReactNode;
	/** Under the bio, for what the bio leaves out (a hidden field, a hint). */
	notes?: React.ReactNode;
	actions: React.ReactNode;
}

/** A profile's header on wide screens: the avatar beside the identity, the counts and the actions. */
export function WideProfileHeader({
	kind,
	name,
	username,
	avatarUrl,
	bio,
	followersCount,
	followingCount,
	badges,
	notes,
	actions,
}: WideProfileHeaderProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.container}>
			<Avatar size="xl" name={name} uri={avatarUrl} />
			<View style={styles.details}>
				<Text style={styles.kind}>{kind}</Text>
				<Text style={styles.name} numberOfLines={2}>
					{name}
				</Text>
				<View style={styles.usernameRow}>
					<Text style={styles.username}>@{username}</Text>
					{badges}
				</View>
				{!!bio && (
					<Text style={styles.bio} numberOfLines={3}>
						{bio}
					</Text>
				)}
				{notes}
				<View style={styles.stats}>
					<Text style={styles.stat}>
						<Text style={styles.statValue}>{followersCount}</Text> Abonnés
					</Text>
					<Text style={styles.stat}>
						<Text style={styles.statValue}>{followingCount}</Text> Abonnements
					</Text>
				</View>
				<View style={styles.actions}>{actions}</View>
			</View>
		</View>
	);
}

/** The height and padding of the header's action buttons. */
export const wideProfileActionStyle = (theme: Theme): ViewStyle => ({
	height: 40,
	paddingHorizontal: theme.spacing.md,
});

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
		usernameRow: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			alignItems: 'center',
			gap: theme.spacing.sm,
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
	});
