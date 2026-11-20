import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GenreSelector } from '@/features/profile/common/presenters/GenreSelector';
import { ProfileScreenFrame } from '@/features/profile/common/presenters/ProfileScreenFrame';
import { Button } from '@/shared/components/ui/Button';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type { MusicGenre } from '@/types/user.types';
import { MAX_GENRES } from '@/types/user.types';

interface MusicPreferencesViewProps {
	theme: Theme;
	bottomPadding: number;
	isLoading: boolean;
	isSaving: boolean;
	selectedGenres: MusicGenre[];
	hasChanges: boolean;
	onGenreToggle: (genre: MusicGenre) => void;
	onSave: () => void;
}

export function MusicPreferencesView({
	bottomPadding,
	isLoading,
	isSaving,
	selectedGenres,
	hasChanges,
	onGenreToggle,
	onSave,
}: MusicPreferencesViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<ProfileScreenFrame
			subtitle={`Quels genres aimez-vous ? Choisissez-en jusqu'à ${MAX_GENRES}.`}
			bottomPadding={bottomPadding}
			isLoading={isLoading}
		>
			<View style={styles.selectorContainer}>
				<GenreSelector
					selectedGenres={selectedGenres}
					onGenreToggle={onGenreToggle}
					maxGenres={MAX_GENRES}
				/>
			</View>

			<Button
				variant="primary"
				onPress={onSave}
				loading={isSaving}
				disabled={!hasChanges || isSaving}
				fullWidth={false}
				style={styles.saveButton}
			>
				Enregistrer
			</Button>
		</ProfileScreenFrame>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		selectorContainer: {
			backgroundColor: theme.colors.surface,
			marginBottom: theme.spacing.lg,
		},
		saveButton: {
			marginHorizontal: 0,
		},
	});
