import React from 'react';
import { PlayerBarButton } from '@/features/playback/features/player-bar/components/presenters/PlayerBarButton';
import { PlayerBarVolumeSlider } from '@/features/playback/features/player-bar/components/presenters/PlayerBarVolumeSlider';
import type { PlayerBarVolume } from '@/features/playback/features/player-bar/playerBarTypes';
import SoundMuteSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/sound-mute-solid.svg';
import SoundOnSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/sound-on-solid.svg';

type PlayerBarVolumeControlProps = {
	volume: PlayerBarVolume;
};

export function PlayerBarVolumeControl({ volume }: PlayerBarVolumeControlProps) {
	const muted = volume.value === 0;

	return (
		<>
			<PlayerBarButton
				icon={muted ? SoundMuteSolid : SoundOnSolid}
				label={muted ? 'Activer le son' : 'Couper le son'}
				onPress={volume.onToggleMute}
				state={{ disabled: volume.disabled }}
			/>
			<PlayerBarVolumeSlider volume={volume} />
		</>
	);
}
