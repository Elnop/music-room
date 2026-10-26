import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FormError } from '@/shared/components/feedback/FormError';
import { GenreChip } from '@/shared/components/ui/GenreChip';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { MUSIC_GENRES, type MusicGenre } from '@/types/user.types';
import { EVENT_LIMITS } from '@/features/events/validators';
import { FieldLabel } from './FieldLabel';

interface GenreSelectorProps {
	selected: MusicGenre[];
	onToggle: (genre: MusicGenre) => void;
	error?: string;
}

export function GenreSelector({ selected, onToggle, error }: GenreSelectorProps) {
	const { styles } = useThemedStyles(createStyles);
	const full = selected.length >= EVENT_LIMITS.GENRES_MAX;

	return (
		<View>
			<FieldLabel>{`Genres (${selected.length}/${EVENT_LIMITS.GENRES_MAX})`}</FieldLabel>
			<View style={styles.chips}>
				{MUSIC_GENRES.map(genre => {
					const isSelected = selected.includes(genre);
					return (
						<GenreChip
							key={genre}
							genre={genre}
							size="sm"
							selected={isSelected}
							disabled={full && !isSelected}
							onPress={() => onToggle(genre)}
						/>
					);
				})}
			</View>
			{error && <FormError message={error} />}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
	});
