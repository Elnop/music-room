import React from 'react';
import { CappedInput } from '@/shared/theme/components/CappedInput';
import type { PlaylistForm } from '@/features/playlists/features/editor/features/playlist-form/playlistFormTypes';

type PlaylistTextFieldsProps = {
	form: PlaylistForm;
};

export function PlaylistTextFields({ form }: PlaylistTextFieldsProps) {
	return (
		<>
			<CappedInput
				field={form.name}
				label="Nom de la playlist"
				placeholder="Ma super playlist"
				autoFocus
				onEnter={form.isSubmitting ? undefined : form.submit}
			/>
			<CappedInput
				field={form.description}
				label="Description (facultative)"
				placeholder="Décrivez votre playlist…"
				multiline
			/>
		</>
	);
}
