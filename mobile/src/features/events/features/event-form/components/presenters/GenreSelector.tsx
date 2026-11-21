import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FormError } from '@/shared/theme/components/FormError';
import { GenreChip } from '@/shared/theme/components/GenreChip';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { MUSIC_GENRES } from '@/shared/users/userConfig';
import type { MusicGenre } from '@/shared/users/userTypes';
import { EVENT_LIMITS } from '@/features/events/features/event-form/eventFormConfig';
import { FieldLabel } from '@/features/events/features/event-form/components/presenters/FieldLabel';

type GenreSelectorProps = {
	selected: MusicGenre[];
	onToggle: (genre: MusicGenre) => void;
	error?: string;
};

export function GenreSelector({ selected, onToggle, error }: GenreSelectorProps) {
	const { styles } = useThemedStyles(createStyles);
	const full = selected.length >= EVENT_LIMITS.GENRES_MAX;

	return (
		<View>
			<FieldLabel label={`Genres (${selected.length}/${EVENT_LIMITS.GENRES_MAX})`} />
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

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
	});
	return styles;
}
