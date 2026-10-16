import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { usePlayerStore } from '@/store/playerStore';
import { useNowPlaying, type NowPlayingTrack } from '@/hooks/useNowPlaying';
import { RESTART_THRESHOLD_S } from '@/store/queueSelectors';

/** Horizontal swipe distance that changes the track (#311). */
export const SWIPE_TRACK_THRESHOLD = 80;
/** A flick this fast (px/s) changes the track or opens the modal from a shorter swipe. */
export const SWIPE_FLICK_VELOCITY = 800;
/** Upward swipe distance that opens the player modal (#311). */
export const SWIPE_OPEN_THRESHOLD = 40;

export function MiniPlayer() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = React.useMemo(() => createStyles(theme, insets), [theme, insets]);

	const toggleModal = usePlayerStore(state => state.toggleModal);
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
	const progress = track && durationMs ? Math.min(100, (positionMs / durationMs) * 100) : 0;

	// Same rules as the buttons: previous restarts the track locally past a few seconds.
	const canGoNext = track !== null && hasNext;
	const canGoPrevious =
		canToggle && (hasPrevious || (!isRemote && positionMs / 1000 > RESTART_THRESHOLD_S));

	// Swipe left / right changes the track, swipe up opens the modal (#311). The
	// offsets let a tap through to the buttons; the info follows the finger.
	const translateX = useSharedValue(0);
	const panGesture = Gesture.Pan()
		.withTestId('mini-player-pan')
		.activeOffsetX([-15, 15])
		.activeOffsetY(-15)
		.onUpdate(event => {
			translateX.value =
				Math.abs(event.translationX) > Math.abs(event.translationY) ? event.translationX : 0;
		})
		.onEnd(event => {
			const horizontal = Math.abs(event.translationX) > Math.abs(event.translationY);
			const toLeft =
				event.translationX < -SWIPE_TRACK_THRESHOLD || event.velocityX < -SWIPE_FLICK_VELOCITY;
			const toRight =
				event.translationX > SWIPE_TRACK_THRESHOLD || event.velocityX > SWIPE_FLICK_VELOCITY;
			const up =
				event.translationY < -SWIPE_OPEN_THRESHOLD || event.velocityY < -SWIPE_FLICK_VELOCITY;
			if (horizontal && toLeft && canGoNext) {
				runOnJS(next)();
			} else if (horizontal && toRight && canGoPrevious) {
				runOnJS(previous)();
			} else if (!horizontal && up) {
				runOnJS(setModalOpen)(true);
			}
			translateX.value = withSpring(0);
		});
	const infoStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}));

	const playDisabled = isLoading || !track;
	const nextDisabled = !canGoNext;
	const openLabel = [
		'Ouvrir le lecteur',
		...(track ? [track.title, track.artist] : ['Rien en lecture']),
		...(deviceLabel ? [`sur ${deviceLabel}`] : []),
	].join(', ');

	return (
		<GestureDetector gesture={panGesture}>
			{/* Not one accessible block: the screen reader reaches the info and each button apart. */}
			<TouchableOpacity
				style={styles.container}
				onPress={toggleModal}
				activeOpacity={0.9}
				accessible={false}
			>
				<View style={styles.content}>
					<Animated.View style={[styles.swipeArea, infoStyle]}>
						<TouchableOpacity
							style={styles.infoButton}
							onPress={toggleModal}
							activeOpacity={0.9}
							accessibilityRole="button"
							accessibilityLabel={openLabel}
						>
							<NowPlayingInfo
								track={track}
								deviceLabel={deviceLabel}
								styles={styles}
								theme={theme}
							/>
						</TouchableOpacity>
					</Animated.View>

					<TouchableOpacity
						style={styles.playButton}
						onPress={() => {
							if (canToggle) toggle();
						}}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						disabled={playDisabled}
						accessibilityRole="button"
						accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}
						accessibilityState={{ disabled: playDisabled, busy: isLoading }}
					>
						{isLoading ? (
							<ActivityIndicator size="small" color="#FFFFFF" />
						) : (
							<Ionicons
								name={isPlaying ? 'pause' : 'play'}
								size={20}
								color="#FFFFFF"
								style={[
									isPlaying ? undefined : { marginLeft: 2 },
									track ? undefined : styles.disabledIcon,
								]}
							/>
						)}
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.nextButton}
						onPress={next}
						hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
						disabled={nextDisabled}
						accessibilityRole="button"
						accessibilityLabel="Piste suivante"
						accessibilityState={{ disabled: nextDisabled }}
					>
						<Ionicons
							name="play-skip-forward"
							size={22}
							color={theme.colors.text}
							style={nextDisabled ? styles.disabledIcon : undefined}
						/>
					</TouchableOpacity>
				</View>

				{/* Progress bar at the bottom of the mini player - always rendered to avoid layout shift */}
				<View style={styles.progressBarContainer}>
					<View style={[styles.progressBar, { width: `${progress}%` }]} />
				</View>
			</TouchableOpacity>
		</GestureDetector>
	);
}

type MiniPlayerStyles = ReturnType<typeof createStyles>;

function NowPlayingInfo({
	track,
	deviceLabel,
	styles,
	theme,
}: {
	track: NowPlayingTrack | null;
	/** Device that plays in remote mode: « Sur Tablette de Léa » (#297). */
	deviceLabel: string | null;
	styles: MiniPlayerStyles;
	theme: Theme;
}) {
	const remoteLine = deviceLabel ? (
		<Text style={styles.device} numberOfLines={1}>
			Sur {deviceLabel}
		</Text>
	) : null;

	if (!track) {
		return (
			<>
				<View style={[styles.artwork, styles.emptyArtwork]}>
					<Ionicons name="musical-notes" size={20} color={theme.colors.textSecondary} />
				</View>
				<View style={styles.info}>
					<Text style={styles.title} numberOfLines={1}>
						Rien en lecture
					</Text>
					<Text style={styles.artist} numberOfLines={1}>
						Choisis un son pour commencer
					</Text>
					{remoteLine}
				</View>
			</>
		);
	}

	const artworkUrl = track.artworkUrl || 'https://via.placeholder.com/40';

	return (
		<>
			<Image source={{ uri: artworkUrl }} style={styles.artwork} />
			<View style={styles.info}>
				<Text style={styles.title} numberOfLines={1}>
					{track.title}
				</Text>
				<Text style={styles.artist} numberOfLines={1}>
					{track.artist}
				</Text>
				{remoteLine}
			</View>
		</>
	);
}

const createStyles = (theme: Theme, insets: EdgeInsets) =>
	StyleSheet.create({
		container: {
			position: 'absolute',
			bottom: 70 + insets.bottom, // Tab bar height (70) + safe area
			left: 0,
			right: 0,
			backgroundColor: theme.colors.background,
		},
		content: {
			flexDirection: 'row',
			alignItems: 'center',
			padding: theme.spacing.sm,
		},
		swipeArea: {
			flex: 1,
		},
		infoButton: {
			flexDirection: 'row',
			alignItems: 'center',
		},
		artwork: {
			width: 40,
			height: 40,
			borderRadius: 8,
			marginRight: theme.spacing.sm,
			backgroundColor: theme.colors.surfaceAlt,
		},
		emptyArtwork: {
			backgroundColor: theme.colors.surface,
			alignItems: 'center',
			justifyContent: 'center',
		},
		info: {
			flex: 1,
			marginRight: theme.spacing.sm,
		},
		title: {
			fontSize: 14,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
			marginBottom: 2,
		},
		artist: {
			fontSize: 12,
			color: theme.colors.textSecondary,
		},
		device: {
			fontSize: 11,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.primary,
		},
		playButton: {
			width: 40,
			height: 40,
			borderRadius: 20,
			backgroundColor: theme.colors.primary,
			alignItems: 'center',
			justifyContent: 'center',
		},
		nextButton: {
			width: 36,
			height: 40,
			marginLeft: theme.spacing.xs,
			alignItems: 'center',
			justifyContent: 'center',
		},
		disabledIcon: {
			opacity: 0.35,
		},
		progressBarContainer: {
			height: 2,
			width: '100%',
			backgroundColor: 'transparent',
		},
		progressBar: {
			height: 2,
			backgroundColor: theme.colors.primary,
		},
	});
