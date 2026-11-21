import React from 'react';
import { View } from 'react-native';
import { KeyButton } from '@/shared/theme/components/KeyButton';
import type { createStyles } from '@/features/playback/features/player-modal/components/presenters/playerModalStyles';
import ArrowLeftSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/arrow-left-solid.svg';
import ArrowRightSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/arrow-right-solid.svg';
import PauseSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pause-solid.svg';
import PlaySolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/play-solid.svg';

interface PlayerControlsProps {
	styles: ReturnType<typeof createStyles>;
	isPlaying: boolean;
	isLoading: boolean;
	canGoPrevious: boolean;
	canGoNext: boolean;
	playDisabled: boolean;
	onPrevious: () => void;
	onPlayPause: () => void;
	onNext: () => void;
}

export function PlayerControls({
	styles,
	isPlaying,
	isLoading,
	canGoPrevious,
	canGoNext,
	playDisabled,
	onPrevious,
	onPlayPause,
	onNext,
}: PlayerControlsProps) {
	return (
		<View style={styles.controls}>
			<KeyButton
				icon={ArrowLeftSolid}
				size={57}
				onPress={onPrevious}
				disabled={!canGoPrevious}
				accessibilityLabel="Piste précédente"
			/>
			<KeyButton
				icon={isPlaying ? PauseSolid : PlaySolid}
				tone="primary"
				size={90}
				iconSize={48}
				onPress={onPlayPause}
				disabled={playDisabled}
				loading={isLoading}
				accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}
			/>
			<KeyButton
				icon={ArrowRightSolid}
				size={57}
				onPress={onNext}
				disabled={!canGoNext}
				accessibilityLabel="Piste suivante"
			/>
		</View>
	);
}
