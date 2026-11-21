import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { ProfileSection } from '@/features/user/shared/profile-section/ProfileSection';
import { GenreChip } from '@/shared/theme/components/GenreChip';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { MusicGenre } from '@/shared/users/userTypes';
import { Text } from '@/shared/theme/components/Text';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type ProfilePreferencesSectionProps = {
	genres: MusicGenre[];
	onModify: () => void;
	prominent?: boolean;
};

export function ProfilePreferencesSection({
	genres,
	onModify,
	prominent,
}: ProfilePreferencesSectionProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<ProfileSection
			title="Préférences musicales"
			prominent={prominent}
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
			) : (
				<Pressable
					style={styles.emptyState}
					onPress={onModify}
					accessibilityLabel="Modifier les préférences musicales"
				>
					<PixelIcon
						icon={MusicSolid}
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

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		genresContainer: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			gap: theme.spacing.xs,
		},
		emptyState: {
			alignItems: 'center',
			paddingVertical: theme.spacing.lg,
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
	return styles;
}
