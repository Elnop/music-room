import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileSection } from '@/features/profile/common/components/presenters/ProfileSection';
import { GenreChip } from '@/shared/components/ui/GenreChip';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type { MusicGenre } from '@/types/user.types';
import { Text } from '@/shared/components/ui/Text';

interface ProfilePreferencesSectionProps {
	genres: MusicGenre[];
	onModify: () => void;
	/** Wide screens: the empty state takes a single line. */
	compact?: boolean;
}

export function ProfilePreferencesSection({
	genres,
	onModify,
	compact = false,
}: ProfilePreferencesSectionProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<ProfileSection
			title="Préférences musicales"
			rightAction={{
				label: 'Modifier',
				onPress: onModify,
			}}
		>
			{genres.length > 0 ? (
				<View style={styles.genresContainer}>
					{genres.map(genre => (
						<GenreChip key={genre} genre={genre} selected size="sm" />
					))}
				</View>
			) : compact ? (
				<Pressable
					style={styles.compactEmptyState}
					onPress={onModify}
					accessibilityLabel="Modifier les préférences musicales"
				>
					<Ionicons name="musical-notes-outline" size={18} color={theme.colors.textSecondary} />
					<Text style={styles.compactEmptyStateText}>Ajoutez jusqu'à 5 genres préférés</Text>
				</Pressable>
			) : (
				<Pressable
					style={styles.emptyState}
					onPress={onModify}
					accessibilityLabel="Modifier les préférences musicales"
				>
					<Ionicons
						name="musical-notes-outline"
						size={32}
						color={theme.colors.textSecondary}
						style={styles.emptyStateIcon}
					/>
					<Text style={styles.emptyStateText}>Ajoutez vos genres préférés</Text>
					<Text style={styles.emptyStateHint}>Touchez pour en choisir jusqu'à 5</Text>
				</Pressable>
			)}
		</ProfileSection>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		genresContainer: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			gap: theme.spacing.xs,
		},
		emptyState: {
			alignItems: 'center',
			paddingVertical: theme.spacing.lg,
		},
		compactEmptyState: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.sm,
		},
		compactEmptyStateText: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
		},
		emptyStateIcon: {
			marginBottom: theme.spacing.sm,
			opacity: 0.6,
		},
		emptyStateText: {
			fontSize: 16,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.text,
		},
		emptyStateHint: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: 4,
		},
	});
