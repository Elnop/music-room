import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProfilePreferencesEmpty } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfilePreferencesEmpty';
import { ProfileSection } from '@/features/user/shared/profile-section/ProfileSection';
import { GenreChip } from '@/shared/theme/components/GenreChip';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { MusicGenre } from '@/shared/users/userTypes';

type ProfilePreferencesSectionProps = {
	genres: MusicGenre[];
	onModify: () => void;
	prominent?: boolean;
};

export function ProfilePreferencesSection(props: ProfilePreferencesSectionProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<ProfileSection
			title="Préférences musicales"
			prominent={props.prominent}
			rightAction={{
				label: 'Modifier',
				onPress: props.onModify,
			}}
		>
			{props.genres.length > 0 ? (
				<View style={styles.genresContainer}>
					{props.genres.map(genre => (
						<GenreChip key={genre} genre={genre} selected size="sm" />
					))}
				</View>
			) : (
				<ProfilePreferencesEmpty onPress={props.onModify} />
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
	});
	return styles;
}
