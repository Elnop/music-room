import React from 'react';
import { KeyButton } from '@/shared/components/ui/KeyButton';
import type { PlayPlaylist } from '@/features/playlists/detail/hooks/usePlayPlaylist';
import PauseSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pause-solid.svg';
import PlaySolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/play-solid.svg';

/** In the header, so it scrolls with the list and never covers a row. */
export function PlayPlaylistButton({ play }: { play: PlayPlaylist }) {
	return (
		<KeyButton
			icon={play.playing ? PauseSolid : PlaySolid}
			tone="primary"
			size={66}
			iconSize={36}
			onPress={play.press}
			loading={play.loading}
			accessibilityLabel={play.playing ? 'Mettre la playlist en pause' : 'Lire la playlist'}
		/>
	);
}
