import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import {
	PLAYLIST_NAME_MAX,
	type NewPlaylistDraft,
} from '@/features/playlists/trackActions/hooks/useNewPlaylistFromTrack';

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

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		form: {
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.md,
		},
	});
