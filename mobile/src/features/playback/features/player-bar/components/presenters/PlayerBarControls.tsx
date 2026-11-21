import React from 'react';
import { TransportRow } from '@/features/playback/shared/transport-row/TransportRow';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';
import { PlayerBarButton } from '@/features/playback/features/player-bar/components/presenters/PlayerBarButton';
import { PlayerBarPlayButton } from '@/features/playback/features/player-bar/components/presenters/PlayerBarPlayButton';
import type { PlayerBarTransport } from '@/features/playback/features/player-bar/playerBarTypes';
import ArrowLeftSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/arrow-left-solid.svg';
import ArrowRightSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/arrow-right-solid.svg';

type PlayerBarControlsProps = {
	nowPlaying: NowPlaying;
	transport: PlayerBarTransport;
};

export function PlayerBarControls({ nowPlaying, transport }: PlayerBarControlsProps) {
	return (
		<TransportRow wide={false}>
			<PlayerBarButton
				icon={ArrowLeftSolid}
				label="Piste précédente"
				onPress={transport.handlePrevious}
				state={{ disabled: !transport.canGoPrevious }}
			/>
			<PlayerBarPlayButton nowPlaying={nowPlaying} transport={transport} />
			<PlayerBarButton
				icon={ArrowRightSolid}
				label="Piste suivante"
				onPress={transport.handleNext}
				state={{ disabled: !transport.canGoNext }}
			/>
		</TransportRow>
	);
}
