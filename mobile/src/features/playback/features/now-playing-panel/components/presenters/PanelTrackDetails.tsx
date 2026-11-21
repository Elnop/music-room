import React from 'react';
import { Artwork } from '@/shared/theme/components/Artwork';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { PanelTrackActions } from '@/features/playback/features/now-playing-panel/components/presenters/PanelTrackActions';
import { PanelTrackTitle } from '@/features/playback/features/now-playing-panel/components/presenters/PanelTrackTitle';
import { PANEL_ARTWORK_SIZE } from '@/features/playback/features/now-playing-panel/nowPlayingPanelConfig';
import type { NowPlayingPanelData } from '@/features/playback/features/now-playing-panel/nowPlayingPanelTypes';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type PanelTrackDetailsProps = {
	data: NowPlayingPanelData;
};

export function PanelTrackDetails({ data }: PanelTrackDetailsProps) {
	const { track, shareUrl } = data;

	if (!track) {
		return (
			<EmptyState
				compact
				icon={MusicSolid}
				message="Rien en lecture : choisissez un titre pour commencer"
			/>
		);
	}
	return (
		<>
			<Artwork uri={data.artworkUrl} size={PANEL_ARTWORK_SIZE} />
			<PanelTrackTitle track={track} />
			{shareUrl && <PanelTrackActions title={track.title} shareUrl={shareUrl} data={data} />}
		</>
	);
}
