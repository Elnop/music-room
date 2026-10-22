import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type { MusicGenre } from '@/types/user.types';
import { MUSIC_GENRES, MAX_GENRES } from '@/types/user.types';
import { GenreChip } from './GenreChip';

interface GenreSelectorProps {
	selectedGenres: MusicGenre[];
	onGenreToggle: (genre: MusicGenre) => void;
	maxGenres?: number;
}

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

const createStyles = (theme: Theme) =>
	StyleSheet.create({
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
			fontWeight: theme.typography.weights.medium,
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
			color: theme.colors.warning || '#F39C12',
			marginTop: theme.spacing.md,
			fontStyle: 'italic',
		},
	});
