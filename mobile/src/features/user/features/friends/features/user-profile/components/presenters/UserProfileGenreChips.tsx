import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { GenreChip } from '@/shared/theme/components/GenreChip';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { MusicGenre } from '@/features/user/features/friends/friendsTypes';

type UserProfileGenreChipsProps = {
	genres: MusicGenre[];
	style?: StyleProp<ViewStyle>;
};

export function UserProfileGenreChips({ genres, style }: UserProfileGenreChipsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={[styles.genres, style]}>
			{genres.map(genre => (
				<GenreChip key={genre} genre={genre} selected size="sm" />
			))}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		genres: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			gap: theme.spacing.xs,
		},
	});
	return styles;
}
