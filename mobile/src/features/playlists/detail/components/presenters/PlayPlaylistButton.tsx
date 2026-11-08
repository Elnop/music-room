import React from 'react';
import { KeyButton } from '@/shared/components/ui/KeyButton';
import type { PlayPlaylist } from '@/features/playlists/detail/hooks/usePlayPlaylist';

export function PlayPlaylistButton({ play }: { play: PlayPlaylist }) {
	return (
		<KeyButton
			icon={play.playing ? 'pause' : 'play'}
			tone="primary"
			size={66}
			iconSize={36}
			onPress={play.press}
			loading={play.loading}
			accessibilityLabel={play.playing ? 'Mettre la playlist en pause' : 'Lire la playlist'}
		/>
	);
}
