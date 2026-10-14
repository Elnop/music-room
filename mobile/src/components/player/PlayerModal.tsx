import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	runOnJS,
	Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@/themes/types';
import { usePlayer } from '@/contexts/PlayerContext';
import { usePlayerStore } from '@/store/playerStore';
import {
	previousAction,
	RESTART_THRESHOLD_S,
	selectHasNext,
	selectHasPrevious,
	useQueueStore,
} from '@/store/queueStore';
import { usePlayerProgress } from '@/hooks/usePlayerProgress';
import { useImageColors, hexToRgba, getAdaptiveColors, isLightColor } from '@/hooks/useImageColors';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { QueueModal } from '@/components/player/QueueModal';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = SCREEN_HEIGHT * 0.2; // 20% de l'écran pour fermer
const ARTWORK_SIZE = width * 0.75;

export function PlayerModal() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();

	const { player, error } = usePlayer();
	const { currentTrack, playbackState, isModalOpen, setModalOpen, pause, resume } =
		usePlayerStore();

	const { currentTime, duration } = usePlayerProgress();
	const hasNext = useQueueStore(selectHasNext);
	const queueHasPrevious = useQueueStore(selectHasPrevious);
	const queueItemId = usePlayerStore(state => state.queueItemId);
	// Only a queue item steps back; a list-tapped track restarts instead.
	const hasPrevious = queueHasPrevious && queueItemId !== null;
	const queueNext = useQueueStore(state => state.next);
	const queuePrevious = useQueueStore(state => state.previous);

	const [isQueueOpen, setQueueOpen] = React.useState(false);
	// The queue opens over the player only: closing the player closes it too.
	const [wasModalOpen, setWasModalOpen] = React.useState(isModalOpen);
	if (wasModalOpen !== isModalOpen) {
		setWasModalOpen(isModalOpen);
		if (!isModalOpen) setQueueOpen(false);
	}

	const translateY = useSharedValue(0);

	const closeModal = () => {
		setModalOpen(false);
	};

	const panGesture = Gesture.Pan()
		.onUpdate(event => {
			if (event.translationY > 0) {
				translateY.value = event.translationY;
			}
		})
		.onEnd(event => {
			if (event.translationY > DISMISS_THRESHOLD || event.velocityY > 500) {
				translateY.value = withTiming(
					SCREEN_HEIGHT,
					{ duration: 250, easing: Easing.out(Easing.cubic) },
					() => {
						runOnJS(closeModal)();
					}
				);
			} else {
				translateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
			}
		});

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	React.useEffect(() => {
		if (isModalOpen) {
			translateY.value = 0;
		}
	}, [isModalOpen, translateY]);

	const artworkUrl = currentTrack?.artwork_url || currentTrack?.user?.avatar_url || null;
	const { dominantColor } = useImageColors(artworkUrl, theme.colors.primary);

	const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

	const isLoading = playbackState === 'loading';
	const isPlaying = playbackState === 'playing';
	const canInteract =
		currentTrack !== null && (playbackState === 'playing' || playbackState === 'paused');

	const adaptive = dominantColor ? getAdaptiveColors(dominantColor) : null;
	const isDarkBg = dominantColor ? !isLightColor(dominantColor) : false;
	const colors = adaptive
		? {
				text: adaptive.text,
				textSecondary: adaptive.textSecondary,
				buttonBg: adaptive.buttonBg,
				slider: adaptive.accent,
				sliderBg: adaptive.accentBg,
				playBtnBg: adaptive.accent,
				playBtnIcon: isDarkBg ? dominantColor! : '#FFF',
			}
		: {
				text: theme.colors.text,
				textSecondary: theme.colors.textSecondary,
				buttonBg: theme.colors.surface,
				slider: theme.colors.primary,
				sliderBg: theme.colors.border,
				playBtnBg: theme.colors.primary,
				playBtnIcon: '#FFF',
			};

	const formatTime = (seconds: number): string => {
		if (!seconds || isNaN(seconds)) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const handlePlayPause = () => {
		if (!canInteract || !player) return;
		if (isPlaying) {
			pause();
		} else {
			resume();
		}
	};

	const handleSeek = (value: number) => {
		if (!player) return;
		player.seekTo(value);
	};

	// Previous restarts the track past RESTART_THRESHOLD_S, otherwise steps back in the queue.
	const handlePrevious = () => {
		if (!player) return;
		if (previousAction(currentTime, hasPrevious) === 'restart') {
			player.seekTo(0);
		} else {
			queuePrevious();
		}
	};

	const handleNext = () => {
		queueNext();
	};

	const canGoPrevious = canInteract && (hasPrevious || currentTime > RESTART_THRESHOLD_S);

	const gradientColors: [string, string, string, string] = dominantColor
		? [
				hexToRgba(dominantColor, 0.95),
				hexToRgba(dominantColor, 0.7),
				hexToRgba(dominantColor, 0.5),
				hexToRgba(dominantColor, 0.4),
			]
		: [
				theme.colors.background,
				theme.colors.background,
				theme.colors.background,
				theme.colors.background,
			];

	const displayArtwork = artworkUrl || 'https://via.placeholder.com/300';
	const canGoNext = currentTrack !== null && hasNext;

	return (
		<Modal
			visible={isModalOpen}
			animationType="slide"
			presentationStyle="overFullScreen"
			transparent
			onRequestClose={() => setModalOpen(false)}
		>
			<GestureDetector gesture={panGesture}>
				<Animated.View style={[styles.container, styles.modalContent, animatedStyle]}>
					<LinearGradient
						colors={gradientColors}
						style={StyleSheet.absoluteFill}
						start={{ x: 0.5, y: 0 }}
						end={{ x: 0.5, y: 1 }}
					/>

					{/* Fixed header at top */}
					<View style={styles.header}>
						<View style={styles.swipeIndicator}>
							<View style={[styles.swipeBar, { backgroundColor: colors.textSecondary }]} />
						</View>

						<TouchableOpacity
							style={styles.closeButton}
							onPress={() => setModalOpen(false)}
							activeOpacity={0.7}
						>
							<View style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}>
								<Ionicons name="chevron-down" size={24} color={colors.text} />
							</View>
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.queueButton}
							onPress={() => setQueueOpen(true)}
							activeOpacity={0.7}
							accessibilityLabel="File d'attente"
						>
							<View style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}>
								<Ionicons name="list" size={22} color={colors.text} />
							</View>
						</TouchableOpacity>

						<Text style={[styles.nowPlayingText, { color: colors.textSecondary }]}>
							NOW PLAYING
						</Text>
					</View>

					{/* Main content centered */}
					<View style={styles.mainContent}>
						<View style={styles.artworkWrapper}>
							<View style={styles.artworkShadow}>
								{currentTrack ? (
									<Image source={{ uri: displayArtwork }} style={styles.artwork} />
								) : (
									<View style={[styles.artwork, styles.emptyArtwork]}>
										<Ionicons name="musical-notes" size={64} color={colors.textSecondary} />
									</View>
								)}
							</View>
						</View>

						<View style={styles.trackInfo}>
							<Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
								{currentTrack ? currentTrack.title : 'Rien en lecture'}
							</Text>
							<Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
								{currentTrack ? currentTrack.user.username : 'Choisis un son pour commencer'}
							</Text>
						</View>

						{error && (
							<View style={styles.errorContainer}>
								<Ionicons name="warning" size={16} color={theme.colors.error} />
								<Text style={styles.errorText}>{error}</Text>
							</View>
						)}

						<View style={styles.progressContainer}>
							<Slider
								style={styles.slider}
								minimumValue={0}
								maximumValue={duration || 1}
								value={currentTrack ? currentTime : 0}
								onSlidingComplete={handleSeek}
								minimumTrackTintColor={colors.slider}
								maximumTrackTintColor={colors.sliderBg}
								thumbTintColor={colors.slider}
								disabled={isLoading || !player || !currentTrack}
							/>
							<View style={styles.timeContainer}>
								<Text style={[styles.timeText, { color: colors.textSecondary }]}>
									{formatTime(currentTrack ? currentTime : 0)}
								</Text>
								<Text style={[styles.timeText, { color: colors.textSecondary }]}>
									{formatTime(currentTrack ? duration : 0)}
								</Text>
							</View>
						</View>

						<View style={styles.controls}>
							<TouchableOpacity
								style={[styles.secondaryButton, { backgroundColor: colors.buttonBg }]}
								onPress={handlePrevious}
								disabled={!canGoPrevious}
								activeOpacity={0.7}
								accessibilityLabel="Previous track"
							>
								<Ionicons
									name="play-skip-back"
									size={28}
									color={colors.text}
									style={canGoPrevious ? undefined : styles.disabledIcon}
								/>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.playButton, { backgroundColor: colors.playBtnBg }]}
								onPress={handlePlayPause}
								disabled={isLoading || !currentTrack}
								activeOpacity={0.8}
								accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
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
											currentTrack ? undefined : styles.disabledIcon,
										]}
									/>
								)}
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.secondaryButton, { backgroundColor: colors.buttonBg }]}
								onPress={handleNext}
								disabled={!canGoNext}
								activeOpacity={0.7}
								accessibilityLabel="Next track"
							>
								<Ionicons
									name="play-skip-forward"
									size={28}
									color={colors.text}
									style={canGoNext ? undefined : styles.disabledIcon}
								/>
							</TouchableOpacity>
						</View>

						{isLoading && (
							<View style={styles.loadingContainer}>
								<Text style={[styles.loadingText, { color: colors.textSecondary }]}>
									Loading audio stream...
								</Text>
							</View>
						)}
					</View>

					{/* Bottom spacer for safe area */}
					<View style={styles.bottomSpacer} />
				</Animated.View>
			</GestureDetector>

			<QueueModal visible={isModalOpen && isQueueOpen} onClose={() => setQueueOpen(false)} />
		</Modal>
	);
}

const createStyles = (theme: Theme, insets: { top: number; bottom: number }) =>
	StyleSheet.create({
		container: {
			flex: 1,
		},
		modalContent: {
			backgroundColor: theme.colors.background,
		},
		header: {
			paddingTop: insets.top + 8,
			alignItems: 'center',
			paddingBottom: 8,
		},
		swipeIndicator: {
			alignItems: 'center',
			marginBottom: 8,
		},
		swipeBar: {
			width: 40,
			height: 5,
			borderRadius: 3,
			opacity: 0.5,
		},
		closeButton: {
			position: 'absolute',
			top: insets.top + 16,
			left: 20,
			zIndex: 10,
		},
		queueButton: {
			position: 'absolute',
			top: insets.top + 16,
			right: 20,
			zIndex: 10,
		},
		headerButton: {
			width: 40,
			height: 40,
			borderRadius: 20,
			justifyContent: 'center',
			alignItems: 'center',
		},
		nowPlayingText: {
			fontSize: 12,
			fontWeight: '600',
			letterSpacing: 2,
			marginTop: 8,
		},
		mainContent: {
			flex: 1,
			justifyContent: 'center',
			paddingBottom: 20,
		},
		bottomSpacer: {
			height: insets.bottom + 20,
		},
		artworkWrapper: {
			alignItems: 'center',
			marginBottom: 32,
		},
		artworkShadow: {
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 16 },
			shadowOpacity: 0.3,
			shadowRadius: 24,
			elevation: 16,
		},
		artwork: {
			width: ARTWORK_SIZE,
			height: ARTWORK_SIZE,
			borderRadius: 12,
			backgroundColor: theme.colors.surface,
		},
		emptyArtwork: {
			alignItems: 'center',
			justifyContent: 'center',
		},
		trackInfo: {
			paddingHorizontal: 32,
			marginBottom: 32,
		},
		title: {
			fontSize: 24,
			fontWeight: '700',
			marginBottom: 8,
			textAlign: 'center',
		},
		artist: {
			fontSize: 17,
			fontWeight: '500',
			textAlign: 'center',
		},
		errorContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: 'rgba(255, 59, 48, 0.15)',
			paddingVertical: 10,
			paddingHorizontal: 16,
			marginHorizontal: 32,
			borderRadius: 12,
			marginBottom: 16,
			gap: 8,
		},
		errorText: {
			color: '#FF3B30',
			fontSize: 14,
			fontWeight: '500',
		},
		progressContainer: {
			paddingHorizontal: 24,
			marginBottom: 24,
		},
		slider: {
			width: '100%',
			height: 40,
		},
		timeContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginTop: -8,
		},
		timeText: {
			fontSize: 13,
			fontWeight: '500',
		},
		controls: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			gap: 40,
			paddingHorizontal: 32,
		},
		secondaryButton: {
			width: 56,
			height: 56,
			borderRadius: 28,
			alignItems: 'center',
			justifyContent: 'center',
		},
		disabledIcon: {
			opacity: 0.35,
		},
		playButton: {
			width: 72,
			height: 72,
			borderRadius: 36,
			alignItems: 'center',
			justifyContent: 'center',
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.2,
			shadowRadius: 8,
			elevation: 8,
		},
		loadingContainer: {
			marginTop: 24,
			alignItems: 'center',
		},
		loadingText: {
			fontSize: 14,
			fontWeight: '500',
		},
	});
