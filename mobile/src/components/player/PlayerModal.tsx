import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
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
import { RESTART_THRESHOLD_S } from '@/store/queueSelectors';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { hapticTap } from '@utils/haptics';
import { useImageColors, getAdaptiveColors } from '@/hooks/useImageColors';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { QueueModal } from '@/components/player/QueueModal';
import { DevicePickerSheet } from '@/components/player/DevicePickerSheet';
import { largeArtwork } from '@/utils/artwork';
import { Artwork } from '@/components/common/Artwork';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = SCREEN_HEIGHT * 0.2; // 20% de l'écran pour fermer
const ARTWORK_SIZE = width * 0.75;
/** Seek step of the slider's screen-reader increment / decrement actions, in seconds. */
export const SEEK_STEP_S = 10;
/** Header buttons are 40×40: this slop brings their tap target to 48×48. */
const HEADER_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };

export function PlayerModal() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();

	const { player, error, seekTo } = usePlayer();
	const isModalOpen = usePlayerStore(state => state.isModalOpen);
	const setModalOpen = usePlayerStore(state => state.setModalOpen);
	const {
		isRemote,
		track,
		isPlaying,
		isLoading,
		canToggle,
		positionMs,
		durationMs,
		deviceLabel,
		toggle,
		next,
		previous,
		hasNext,
		hasPrevious,
	} = useNowPlaying();
	const currentTime = positionMs / 1000;
	const duration = durationMs !== null ? durationMs / 1000 : null;

	const [isQueueOpen, setQueueOpen] = React.useState(false);
	const [isDevicesOpen, setDevicesOpen] = React.useState(false);
	// The queue and the device picker open over the player only: closing the player closes them too.
	const [wasModalOpen, setWasModalOpen] = React.useState(isModalOpen);
	if (wasModalOpen !== isModalOpen) {
		setWasModalOpen(isModalOpen);
		if (!isModalOpen) {
			setQueueOpen(false);
			setDevicesOpen(false);
		}
	}

	const translateY = useSharedValue(0);

	const closeModal = () => {
		setModalOpen(false);
	};

	// A Modal is its own native window on Android: gestures reach it only through the
	// GestureHandlerRootView below. The pan starts on a downward drag only and gives way to
	// horizontal moves, so the progress slider keeps working.
	const panGesture = Gesture.Pan()
		.withTestId('player-modal-pan')
		.activeOffsetY(10)
		.failOffsetX([-15, 15])
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

	// Shown across the screen: the 500×500 image, not the API's 100×100 (#307).
	const artworkUrl = largeArtwork(track?.artworkUrl);
	const { dominantColor } = useImageColors(artworkUrl, theme.colors.primary);

	const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

	const adaptive = useMemo(
		() => (dominantColor ? getAdaptiveColors(dominantColor, theme.colors.background) : null),
		[dominantColor, theme.colors.background]
	);
	const colors = adaptive
		? {
				text: adaptive.text,
				textSecondary: adaptive.textSecondary,
				buttonBg: adaptive.buttonBg,
				slider: adaptive.accent,
				sliderBg: adaptive.accentBg,
				playBtnBg: adaptive.accent,
				playBtnIcon: adaptive.onAccent,
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
		if (!canToggle) return;
		hapticTap();
		toggle();
	};

	// No remote seek: the backend has no such command (#297).
	const handleSeek = (value: number) => {
		if (!player || isRemote) return;
		seekTo(value);
	};

	// Screen readers adjust the slider by steps (TalkBack: swipe up / down, volume keys).
	const handleSliderAction = (actionName: string) => {
		if (duration === null) return;
		const step =
			actionName === 'increment' ? SEEK_STEP_S : actionName === 'decrement' ? -SEEK_STEP_S : 0;
		if (step === 0) return;
		handleSeek(Math.min(duration, Math.max(0, currentTime + step)));
	};

	// Local: previous restarts the track past RESTART_THRESHOLD_S, otherwise steps back
	// in the queue. Remote: always steps back, since the phone cannot seek the device.
	const canGoPrevious =
		canToggle && (hasPrevious || (!isRemote && currentTime > RESTART_THRESHOLD_S));
	const canGoNext = track !== null && hasNext;
	const handlePrevious = () => {
		if (!canGoPrevious) return;
		hapticTap();
		previous();
	};
	const handleNext = () => {
		if (!canGoNext) return;
		hapticTap();
		next();
	};

	const gradientColors: [string, string, string, string] = adaptive
		? adaptive.gradient
		: [
				theme.colors.background,
				theme.colors.background,
				theme.colors.background,
				theme.colors.background,
			];

	const sliderDisabled = isRemote || isLoading || !player || !track;
	const playDisabled = isLoading || !track;

	return (
		<Modal
			visible={isModalOpen}
			animationType="slide"
			presentationStyle="overFullScreen"
			transparent
			onRequestClose={() => setModalOpen(false)}
		>
			<GestureHandlerRootView style={styles.container}>
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
								hitSlop={HEADER_HIT_SLOP}
								accessibilityRole="button"
								accessibilityLabel="Fermer le lecteur"
							>
								<View style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}>
									<Ionicons name="chevron-down" size={24} color={colors.text} />
								</View>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.devicesButton}
								onPress={() => setDevicesOpen(true)}
								activeOpacity={0.7}
								hitSlop={HEADER_HIT_SLOP}
								accessibilityRole="button"
								accessibilityLabel="Choisir l'appareil"
							>
								<View style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}>
									<Ionicons name="phone-portrait-outline" size={20} color={colors.text} />
								</View>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.queueButton}
								onPress={() => setQueueOpen(true)}
								activeOpacity={0.7}
								hitSlop={HEADER_HIT_SLOP}
								accessibilityRole="button"
								accessibilityLabel="File d'attente"
							>
								<View style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}>
									<Ionicons name="list" size={22} color={colors.text} />
								</View>
							</TouchableOpacity>

							<Text style={[styles.nowPlayingText, { color: colors.textSecondary }]}>
								EN COURS DE LECTURE
							</Text>
							{deviceLabel && (
								<Text
									style={[styles.deviceText, { color: colors.text }]}
									numberOfLines={1}
									accessibilityLabel={`Lecture sur ${deviceLabel}`}
								>
									Sur {deviceLabel}
								</Text>
							)}
						</View>

						{/* Main content centered */}
						<View style={styles.mainContent}>
							<View style={styles.artworkWrapper}>
								<View style={styles.artworkShadow}>
									{track ? (
										<Artwork
											uri={artworkUrl}
											size={ARTWORK_SIZE}
											style={styles.artwork}
											iconSize={64}
										/>
									) : (
										<View style={[styles.artwork, styles.emptyArtwork]}>
											<Ionicons name="musical-notes" size={64} color={colors.textSecondary} />
										</View>
									)}
								</View>
							</View>

							<View style={styles.trackInfo}>
								<Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
									{track ? track.title : 'Rien en lecture'}
								</Text>
								<Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
									{track ? track.artist : 'Choisissez un titre pour commencer'}
								</Text>
							</View>

							{error && !isRemote && (
								<View style={styles.errorContainer}>
									<Ionicons name="warning" size={16} color={theme.colors.error} />
									<Text style={styles.errorText}>{error}</Text>
								</View>
							)}

							{/* Hidden when the length is unknown (a remote track off the queue). */}
							{duration !== null && (
								<View style={styles.progressContainer}>
									{/* The slider library drops onAccessibilityAction: this wrapper is what a
									    screen reader sees and adjusts; touch drags still reach the slider. */}
									<View
										accessible
										accessibilityRole="adjustable"
										accessibilityLabel="Position de lecture"
										accessibilityValue={{
											text: `${formatTime(track ? currentTime : 0)} sur ${formatTime(track ? duration : 0)}`,
										}}
										accessibilityState={{ disabled: sliderDisabled }}
										accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
										onAccessibilityAction={event => {
											if (!sliderDisabled) handleSliderAction(event.nativeEvent.actionName);
										}}
									>
										<Slider
											style={styles.slider}
											minimumValue={0}
											maximumValue={duration || 1}
											value={track ? currentTime : 0}
											onSlidingComplete={handleSeek}
											minimumTrackTintColor={colors.slider}
											maximumTrackTintColor={colors.sliderBg}
											thumbTintColor={colors.slider}
											disabled={sliderDisabled}
											importantForAccessibility="no-hide-descendants"
										/>
									</View>
									<View style={styles.timeContainer}>
										<Text style={[styles.timeText, { color: colors.textSecondary }]}>
											{formatTime(track ? currentTime : 0)}
										</Text>
										<Text style={[styles.timeText, { color: colors.textSecondary }]}>
											{formatTime(track ? duration : 0)}
										</Text>
									</View>
								</View>
							)}

							<View style={styles.controls}>
								<TouchableOpacity
									style={[styles.secondaryButton, { backgroundColor: colors.buttonBg }]}
									onPress={handlePrevious}
									disabled={!canGoPrevious}
									activeOpacity={0.7}
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
								</TouchableOpacity>

								<TouchableOpacity
									style={[styles.playButton, { backgroundColor: colors.playBtnBg }]}
									onPress={handlePlayPause}
									disabled={playDisabled}
									activeOpacity={0.8}
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
												track ? undefined : styles.disabledIcon,
											]}
										/>
									)}
								</TouchableOpacity>

								<TouchableOpacity
									style={[styles.secondaryButton, { backgroundColor: colors.buttonBg }]}
									onPress={handleNext}
									disabled={!canGoNext}
									activeOpacity={0.7}
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
								</TouchableOpacity>
							</View>

							{isLoading && (
								<View style={styles.loadingContainer}>
									<Text style={[styles.loadingText, { color: colors.textSecondary }]}>
										Chargement du flux audio…
									</Text>
								</View>
							)}
						</View>

						{/* Bottom spacer for safe area */}
						<View style={styles.bottomSpacer} />
					</Animated.View>
				</GestureDetector>

				<QueueModal visible={isModalOpen && isQueueOpen} onClose={() => setQueueOpen(false)} />
				<DevicePickerSheet
					visible={isModalOpen && isDevicesOpen}
					onClose={() => setDevicesOpen(false)}
				/>
			</GestureHandlerRootView>
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
		devicesButton: {
			position: 'absolute',
			top: insets.top + 16,
			right: 68,
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
		deviceText: {
			fontSize: 13,
			fontWeight: '600',
			marginTop: 4,
			paddingHorizontal: 112,
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
			backgroundColor: theme.colors.surfaceAlt,
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
