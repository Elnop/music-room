import React from 'react';
import { StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';
import type { MusicGenre } from '@/features/user/features/friends/friendsTypes';
import { HiddenFieldNote } from '@/features/user/features/friends/features/user-profile/components/presenters/HiddenFieldNote';
import { UserProfileGenreChips } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileGenreChips';

type UserProfileGenresProps = {
	genres: MusicGenre[] | undefined;
	isFriend: boolean;
};

export function UserProfileGenres({ genres, isFriend }: UserProfileGenresProps) {
	const { styles } = useThemedStyles(createStyles);

	if (genres === undefined) {
		return <HiddenFieldNote label={isFriend ? 'Privées' : 'Visibles uniquement par ses amis'} />;
	}
	if (genres.length === 0) return <Text style={styles.empty}>Aucun genre choisi</Text>;
	return <UserProfileGenreChips genres={genres} />;
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		empty: { fontSize: theme.typography.sizes.md, color: theme.colors.textSecondary },
	});
	return styles;
}
