import React from 'react';
import { TransportRow } from '@/features/playback/shared/transport-row/TransportRow';
import { KeyButton } from '@/shared/theme/components/KeyButton';
import { PlayerPlayKey } from '@/features/playback/features/player-modal/components/presenters/PlayerPlayKey';
import type {
	PlayerTransportActions,
	PlayerTransportState,
} from '@/features/playback/features/player-modal/playerModalTypes';
import ArrowLeftSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/arrow-left-solid.svg';
import ArrowRightSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/arrow-right-solid.svg';

type PlayerControlsProps = {
	state: PlayerTransportState;
	actions: PlayerTransportActions;
};

export function PlayerControls({ state, actions }: PlayerControlsProps) {
	return (
		<TransportRow wide>
			<KeyButton
				icon={ArrowLeftSolid}
				onPress={actions.onPrevious}
				accessibilityLabel="Piste précédente"
				appearance={{ size: 57 }}
				state={{ disabled: !state.canGoPrevious }}
			/>
			<PlayerPlayKey state={state} onPlayPause={actions.onPlayPause} />
			<KeyButton
				icon={ArrowRightSolid}
				onPress={actions.onNext}
				accessibilityLabel="Piste suivante"
				appearance={{ size: 57 }}
				state={{ disabled: !state.canGoNext }}
			/>
		</TransportRow>
	);
}
