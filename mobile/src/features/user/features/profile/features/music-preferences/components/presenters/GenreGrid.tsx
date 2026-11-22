import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { GenreSelection } from '@/features/user/features/profile/features/music-preferences/musicPreferencesTypes';
import { GenreChip } from '@/shared/theme/components/GenreChip';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { MUSIC_GENRES } from '@/shared/users/userConfig';

type GenreGridProps = {
	selection: GenreSelection;
	isMaxReached: boolean;
};

export function GenreGrid({ selection, isMaxReached }: GenreGridProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.genresGrid}>
			{MUSIC_GENRES.map((genre) => {
				const isSelected = selection.selectedGenres.includes(genre);

				return (
					<GenreChip
						key={genre}
						genre={genre}
						selected={isSelected}
						disabled={!isSelected && isMaxReached}
						onPress={() => selection.onGenreToggle(genre)}
					/>
				);
			})}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		genresGrid: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			gap: theme.spacing.sm,
		},
	});
	return styles;
}
