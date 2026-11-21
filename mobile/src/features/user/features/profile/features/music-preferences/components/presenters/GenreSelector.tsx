import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GenreChip } from '@/shared/theme/components/GenreChip';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';
import type { MusicGenre } from '@/shared/users/user.types';
import { MAX_GENRES, MUSIC_GENRES } from '@/shared/users/user.types';
import { Text } from '@/shared/theme/components/Text';

type GenreSelectorProps = {
	selectedGenres: MusicGenre[];
	onGenreToggle: (genre: MusicGenre) => void;
	maxGenres?: number;
};

export function GenreSelector({
	selectedGenres,
	onGenreToggle,
	maxGenres = MAX_GENRES,
}: GenreSelectorProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const isMaxReached = selectedGenres.length >= maxGenres;

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.counter}>
					{selectedGenres.length}/{maxGenres} {selectedGenres.length > 1 ? 'choisis' : 'choisi'}
				</Text>
			</View>

			<Text style={styles.description}>
				Choisissez jusqu'à {maxGenres} genres qui définissent vos goûts musicaux
			</Text>

			<View style={styles.genresGrid}>
				{MUSIC_GENRES.map(genre => {
					const isSelected = selectedGenres.includes(genre);
					const isDisabled = !isSelected && isMaxReached;

					return (
						<GenreChip
							key={genre}
							genre={genre}
							selected={isSelected}
							disabled={isDisabled}
							onPress={() => onGenreToggle(genre)}
						/>
					);
				})}
			</View>

			{isMaxReached && (
				<Text style={styles.maxWarning}>
					Nombre maximum de genres atteint. Retirez-en un pour en ajouter un autre.
				</Text>
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			padding: theme.spacing.md,
		},
		header: {
			flexDirection: 'row',
			justifyContent: 'flex-end',
			alignItems: 'center',
			marginBottom: theme.spacing.xs,
		},
		counter: {
			fontSize: 14,
			color: theme.colors.primary,
			fontFamily: theme.typography.families.medium,
		},
		description: {
			fontSize: 14,
			color: theme.colors.textSecondary,
			marginBottom: theme.spacing.lg,
		},
		genresGrid: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			gap: theme.spacing.sm,
		},
		maxWarning: {
			fontSize: 12,
			color: theme.colors.warning,
			marginTop: theme.spacing.md,
			fontStyle: 'italic',
		},
	});
	return styles;
}
