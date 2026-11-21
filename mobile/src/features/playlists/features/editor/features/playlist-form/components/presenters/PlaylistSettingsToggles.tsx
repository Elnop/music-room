import React from 'react';
import { ToggleCard } from '@/features/playlists/features/editor/features/playlist-form/components/presenters/ToggleCard';
import type { PlaylistSettings } from '@/features/playlists/features/editor/features/playlist-form/playlistFormTypes';

type PlaylistSettingsTogglesProps = {
	settings: PlaylistSettings;
};

export function PlaylistSettingsToggles({ settings }: PlaylistSettingsTogglesProps) {
	return (
		<>
			<ToggleCard
				label="Playlist privée"
				description={settings.isPrivate ? 'Visible uniquement par les invités' : 'Visible par tous'}
				value={settings.isPrivate}
				onValueChange={settings.setIsPrivate}
			/>
			<ToggleCard
				label="Modification restreinte"
				description={
					settings.isEditRestricted
						? 'Seules les personnes autorisées peuvent la modifier'
						: 'Tout le monde peut ajouter ou retirer des titres'
				}
				value={settings.isEditRestricted}
				onValueChange={settings.setIsEditRestricted}
			/>
		</>
	);
}
