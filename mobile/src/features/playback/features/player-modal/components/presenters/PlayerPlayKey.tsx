import React from 'react';
import { KeyButton } from '@/shared/theme/components/KeyButton';
import type { PlayerTransportState } from '@/features/playback/features/player-modal/playerModalTypes';
import PauseSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pause-solid.svg';
import PlaySolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/play-solid.svg';

type PlayerPlayKeyProps = {
	state: PlayerTransportState;
	onPlayPause: () => void;
};

export function PlayerPlayKey({ state, onPlayPause }: PlayerPlayKeyProps) {
	const { isPlaying } = state;

	return (
		<KeyButton
			icon={isPlaying ? PauseSolid : PlaySolid}
			onPress={onPlayPause}
			accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}
			appearance={{ tone: 'primary', size: 90, iconSize: 48 }}
			state={{ disabled: state.playDisabled, loading: state.isLoading }}
		/>
	);
}
