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
				onPress={onPrevious}
				accessibilityLabel="Piste précédente"
				appearance={{ size: 57 }}
				state={{ disabled: !canGoPrevious }}
			/>
			<KeyButton
				icon={isPlaying ? PauseSolid : PlaySolid}
				onPress={onPlayPause}
				accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}
				appearance={{ tone: 'primary', size: 90, iconSize: 48 }}
				state={{ disabled: playDisabled, loading: isLoading }}
			/>
			<KeyButton
				icon={ArrowRightSolid}
				onPress={onNext}
				accessibilityLabel="Piste suivante"
				appearance={{ size: 57 }}
				state={{ disabled: !canGoNext }}
			/>
		</View>
	);
}
