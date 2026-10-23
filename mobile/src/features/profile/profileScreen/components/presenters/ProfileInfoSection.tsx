import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ProfileSection } from '@/features/profile/common/components/presenters/ProfileSection';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type { UserProfile } from '@/types/user.types';

interface ProfileInfoSectionProps {
	user: UserProfile;
}

export function ProfileInfoSection({ user }: ProfileInfoSectionProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const joinedDate = React.useMemo(() => {
		try {
			return new Date(user.createdAt).toLocaleDateString('fr-FR', {
				month: 'long',
				year: 'numeric',
			});
		} catch {
			return '';
		}
	}, [user.createdAt]);

	return (
		<ProfileSection title="Information">
			<View style={styles.infoItem}>
				<Text style={styles.infoLabel}>Email</Text>
				<Text style={styles.infoValue}>{user.email}</Text>
			</View>

			<View style={styles.divider} />

			<View style={styles.infoItem}>
				<Text style={styles.infoLabel}>Nom d'utilisateur</Text>
				<Text style={styles.infoValue}>@{user.username}</Text>
			</View>

			<View style={styles.divider} />

			<View style={styles.infoItem}>
				<Text style={styles.infoLabel}>Membre depuis</Text>
				<Text style={styles.infoValue}>{joinedDate}</Text>
			</View>
		</ProfileSection>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		infoItem: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingVertical: theme.spacing.sm,
		},
		infoLabel: {
			fontSize: 15,
			color: theme.colors.textSecondary,
		},
		infoValue: {
			fontSize: 15,
			color: theme.colors.text,
			fontWeight: theme.typography.weights.medium,
		},
		divider: {
			height: 1,
			backgroundColor: theme.colors.border,
		},
	});
