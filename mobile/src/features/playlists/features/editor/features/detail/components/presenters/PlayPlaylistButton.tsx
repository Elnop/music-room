import React from 'react';
import { KeyButton } from '@/shared/theme/components/KeyButton';
import type { PlayPlaylist } from '@/features/playlists/features/editor/features/detail/hooks/usePlayPlaylist';
import PauseSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pause-solid.svg';
import PlaySolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/play-solid.svg';

export function PlayPlaylistButton({ play }: { play: PlayPlaylist }) {
	return (
		<KeyButton
			icon={play.playing ? PauseSolid : PlaySolid}
			onPress={play.press}
			accessibilityLabel={play.playing ? 'Mettre la playlist en pause' : 'Lire la playlist'}
			appearance={{ tone: 'primary', size: 66, iconSize: 36 }}
			state={{ loading: play.loading }}
		/>
	);
}
