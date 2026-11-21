import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/shared/theme/components/Button';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PlaylistForm } from '@/features/playlists/features/editor/features/playlist-form/playlistFormTypes';
import { PlaylistTextFields } from '@/features/playlists/features/editor/features/playlist-form/components/presenters/PlaylistTextFields';
import { PlaylistSettingsToggles } from '@/features/playlists/features/editor/features/playlist-form/components/presenters/PlaylistSettingsToggles';

type PlaylistFormFieldsProps = {
	form: PlaylistForm;
};

export function PlaylistFormFields({ form }: PlaylistFormFieldsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.form}>
			<PlaylistTextFields form={form} />
			{!form.isEditing && <PlaylistSettingsToggles settings={form} />}
			<Button
				title={form.isEditing ? 'Enregistrer' : 'Créer la playlist'}
				onPress={form.submit}
				loading={form.isSubmitting}
				fullWidth
				variant="primary"
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		form: { gap: theme.spacing.md },
	});
	return styles;
}
