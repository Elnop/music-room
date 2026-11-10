import React from 'react';
import { View } from 'react-native';
import { KeyButton } from '@/shared/components/ui/KeyButton';
import type { createStyles } from './playerModalStyles';
import { Text } from '@/shared/components/ui/Text';

interface PlayerControlsProps {
	styles: ReturnType<typeof createStyles>;
	colors: {
		textSecondary: string;
	};
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
	colors,
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
		<>
			<View style={styles.controls}>
				<KeyButton
					icon="prev"
					size={57}
					onPress={onPrevious}
					disabled={!canGoPrevious}
					accessibilityLabel="Piste précédente"
				/>
				<KeyButton
					icon={isPlaying ? 'pause' : 'play'}
					tone="primary"
					size={90}
					iconSize={48}
					onPress={onPlayPause}
					disabled={playDisabled}
					loading={isLoading}
					accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}
				/>
				<KeyButton
					icon="next"
					size={57}
					onPress={onNext}
					disabled={!canGoNext}
					accessibilityLabel="Piste suivante"
				/>
			</View>

			{isLoading && (
				<View style={styles.loadingContainer}>
					<Text style={[styles.loadingText, { color: colors.textSecondary }]}>
						Chargement du flux audio…
					</Text>
				</View>
			)}
		</>
	);
}
