import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GenreGrid } from '@/features/user/features/profile/features/music-preferences/components/presenters/GenreGrid';
import { GenreSelectorIntro } from '@/features/user/features/profile/features/music-preferences/components/presenters/GenreSelectorIntro';
import type { GenreSelection } from '@/features/user/features/profile/features/music-preferences/musicPreferencesTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { MAX_GENRES } from '@/shared/users/userConfig';
import { Text } from '@/shared/theme/components/Text';

type GenreSelectorProps = {
	selection: GenreSelection;
	maxGenres?: number;
};

export function GenreSelector({ selection, maxGenres = MAX_GENRES }: GenreSelectorProps) {
	const { styles } = useThemedStyles(createStyles);
	const isMaxReached = selection.selectedGenres.length >= maxGenres;

	return (
		<View style={styles.container}>
			<GenreSelectorIntro selectedCount={selection.selectedGenres.length} maxGenres={maxGenres} />
			<GenreGrid selection={selection} isMaxReached={isMaxReached} />
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
		maxWarning: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.warning,
			marginTop: theme.spacing.md,
			fontStyle: 'italic',
		},
	});
	return styles;
}
