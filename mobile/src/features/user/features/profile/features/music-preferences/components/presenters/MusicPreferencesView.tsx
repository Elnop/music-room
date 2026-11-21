import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GenreSelector } from '@/features/user/features/profile/features/music-preferences/components/presenters/GenreSelector';
import type {
	GenreSelection,
	PreferencesSave,
} from '@/features/user/features/profile/features/music-preferences/musicPreferencesTypes';
import { ProfileScreenFrame } from '@/features/user/shared/profile-layout/ProfileScreenFrame';
import { Button } from '@/shared/theme/components/Button';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { MAX_GENRES } from '@/shared/users/userConfig';

type MusicPreferencesViewProps = {
	bottomPadding: number;
	isLoading: boolean;
	selection: GenreSelection;
	save: PreferencesSave;
};

export function MusicPreferencesView(props: MusicPreferencesViewProps) {
	const { styles } = useThemedStyles(createStyles);
	const { save } = props;

	return (
		<ProfileScreenFrame
			subtitle={`Quels genres aimez-vous ? Choisissez-en jusqu'à ${MAX_GENRES}.`}
			bottomPadding={props.bottomPadding}
			isLoading={props.isLoading}
		>
			<View style={styles.selectorContainer}>
				<GenreSelector selection={props.selection} maxGenres={MAX_GENRES} />
			</View>

			<Button
				variant="primary"
				onPress={save.onSave}
				loading={save.isSaving}
				disabled={!save.hasChanges || save.isSaving}
				fullWidth={false}
				style={styles.saveButton}
				title="Enregistrer"
			/>
		</ProfileScreenFrame>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		selectorContainer: {
			backgroundColor: theme.colors.surface,
			marginBottom: theme.spacing.lg,
		},
		saveButton: {
			marginHorizontal: 0,
		},
	});
	return styles;
}
