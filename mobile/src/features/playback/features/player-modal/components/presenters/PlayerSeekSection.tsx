import React from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { PlayerProgressSlider } from '@/features/playback/shared/seek-bar/components/PlayerProgressSlider';
import { createSliderStyles } from '@/features/playback/features/player-modal/lib/createSliderStyles';
import type { PlayerModalParts } from '@/features/playback/features/player-modal/playerModalTypes';

type PlayerSeekSectionProps = {
	parts: PlayerModalParts;
};

export function PlayerSeekSection({ parts }: PlayerSeekSectionProps) {
	const { styles } = useThemedStyles(createSliderStyles);
	const { modal, gestures, seek } = parts;
	const { controls } = modal;

	return (
		<GestureDetector gesture={gestures.sliderGesture}>
			<View>
				<PlayerProgressSlider
					appearance={{ styles, colors: modal.colors }}
					seek={seek}
					duration={controls.duration}
					hasTrack={modal.track !== null}
					disabled={controls.sliderDisabled}
					onSliderAction={controls.handleSliderAction}
				/>
			</View>
		</GestureDetector>
	);
}
