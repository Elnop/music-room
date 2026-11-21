import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Input } from '@/shared/theme/components/Input';
import { Button } from '@/shared/theme/components/Button';
import type { NewPlaylistDraft } from '@/features/playlists/features/editor/features/track-actions/hooks/useNewPlaylistFromTrack';
import { PLAYLIST_NAME_MAX } from '@/features/playlists/features/editor/features/track-actions/playlistName';

interface NewPlaylistFormProps {
	draft: NewPlaylistDraft;
}

export function NewPlaylistForm({ draft }: NewPlaylistFormProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.form}>
			<Input
				label="Nom de la playlist"
				accessibilityLabel="Nom de la playlist"
				value={draft.name}
				onChangeText={draft.setName}
				error={draft.error}
				maxLength={PLAYLIST_NAME_MAX}
				autoFocus
				selectTextOnFocus
				returnKeyType="done"
				onSubmitEditing={draft.submit}
				submitOnEnter={draft.submit}
				editable={!draft.creating}
			/>
			<Button title="Créer et ajouter" onPress={draft.submit} loading={draft.creating} fullWidth />
		</View>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		form: {
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.md,
		},
	});
}
