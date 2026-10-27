import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import type { createStyles } from './playerModalStyles';
import { Text } from '@/shared/components/ui/Text';

interface PlayerControlsProps {
	styles: ReturnType<typeof createStyles>;
	colors: {
		text: string;
		textSecondary: string;
		buttonBg: string;
		playBtnBg: string;
		playBtnIcon: string;
	};
	isPlaying: boolean;
	isLoading: boolean;
	hasTrack: boolean;
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
	hasTrack,
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
				<Pressable
					style={[styles.secondaryButton, { backgroundColor: colors.buttonBg }]}
					onPress={onPrevious}
					disabled={!canGoPrevious}
					accessibilityRole="button"
					accessibilityLabel="Piste précédente"
					accessibilityState={{ disabled: !canGoPrevious }}
				>
					<Ionicons
						name="play-skip-back"
						size={28}
						color={colors.text}
						style={canGoPrevious ? undefined : styles.disabledIcon}
					/>
				</Pressable>

				<Pressable
					style={[styles.playButton, { backgroundColor: colors.playBtnBg }]}
					onPress={onPlayPause}
					disabled={playDisabled}
					accessibilityRole="button"
					accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}
					accessibilityState={{ disabled: playDisabled, busy: isLoading }}
				>
					{isLoading ? (
						<LoadingSpinner size="small" />
					) : (
						<Ionicons
							name={isPlaying ? 'pause' : 'play'}
							size={40}
							color={colors.playBtnIcon}
							style={[
								isPlaying ? undefined : { marginLeft: 4 },
								hasTrack ? undefined : styles.disabledIcon,
							]}
						/>
					)}
				</Pressable>

				<Pressable
					style={[styles.secondaryButton, { backgroundColor: colors.buttonBg }]}
					onPress={onNext}
					disabled={!canGoNext}
					accessibilityRole="button"
					accessibilityLabel="Piste suivante"
					accessibilityState={{ disabled: !canGoNext }}
				>
					<Ionicons
						name="play-skip-forward"
						size={28}
						color={colors.text}
						style={canGoNext ? undefined : styles.disabledIcon}
					/>
				</Pressable>
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
