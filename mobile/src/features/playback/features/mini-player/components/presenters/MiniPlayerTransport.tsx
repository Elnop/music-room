import React from 'react';
import { KeyButton } from '@/shared/theme/components/KeyButton';
import { MiniPlayerNextButton } from '@/features/playback/features/mini-player/components/presenters/MiniPlayerNextButton';
import type { MiniPlayerData } from '@/features/playback/features/mini-player/miniPlayerTypes';
import PauseSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pause-solid.svg';
import PlaySolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/play-solid.svg';

type MiniPlayerTransportProps = {
	data: MiniPlayerData;
};

export function MiniPlayerTransport({ data }: MiniPlayerTransportProps) {
	const { isPlaying } = data;

	return (
		<>
			<KeyButton
				icon={isPlaying ? PauseSolid : PlaySolid}
				onPress={data.onTogglePlay}
				accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}
				appearance={{ tone: data.track ? 'primary' : 'surface', size: 42 }}
				state={{ disabled: data.playDisabled, loading: data.isLoading }}
			/>
			<MiniPlayerNextButton disabled={data.nextDisabled} onPress={data.onNext} />
		</>
	);
}
