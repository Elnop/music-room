import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import { usePlayer } from '@/contexts/PlayerContext';
import { usePlayerStore } from '@/store/playerStore';
import { selectHasNext, useQueueStore } from '@/store/queueStore';
import { usePlayerProgress } from '@/hooks/usePlayerProgress';

export function MiniPlayer() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = React.useMemo(() => createStyles(theme, insets), [theme, insets]);

	const { player } = usePlayer();
	const { currentTrack, playbackState, pause, resume, toggleModal } = usePlayerStore();
	const { progress } = usePlayerProgress();
	const hasNext = useQueueStore(selectHasNext);
	const queueNext = useQueueStore(state => state.next);

	const isLoading = playbackState === 'loading';
	const isPlaying = playbackState === 'playing';
	const canInteract = !!currentTrack && (playbackState === 'playing' || playbackState === 'paused');

	const handlePlayPause = () => {
		if (!canInteract || !player) return;

		if (isPlaying) {
			pause();
		} else {
			resume();
		}
	};

	return (
		<TouchableOpacity style={styles.container} onPress={toggleModal} activeOpacity={0.9}>
			<View style={styles.content}>
				<NowPlayingInfo currentTrack={currentTrack} styles={styles} theme={theme} />

				<TouchableOpacity
					style={styles.playButton}
					onPress={handlePlayPause}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					disabled={isLoading || !currentTrack}
					accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
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
								currentTrack ? undefined : styles.disabledIcon,
							]}
						/>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.nextButton}
					onPress={() => queueNext()}
					hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
					disabled={!currentTrack || !hasNext}
					accessibilityLabel="Next track"
				>
					<Ionicons
						name="play-skip-forward"
						size={22}
						color={theme.colors.text}
						style={currentTrack && hasNext ? undefined : styles.disabledIcon}
					/>
				</TouchableOpacity>
			</View>

			{/* Progress bar at the bottom of the mini player - always rendered to avoid layout shift */}
			<View style={styles.progressBarContainer}>
				<View
					style={[
						styles.progressBar,
						{
							width: `${currentTrack ? progress : 0}%`,
						},
					]}
				/>
			</View>
		</TouchableOpacity>
	);
}

type MiniPlayerStyles = ReturnType<typeof createStyles>;

function NowPlayingInfo({
	currentTrack,
	styles,
	theme,
}: {
	currentTrack: SoundCloudTrack | null;
	styles: MiniPlayerStyles;
	theme: Theme;
}) {
	if (!currentTrack) {
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
				</View>
			</>
		);
	}

	const artworkUrl =
		currentTrack.artwork_url || currentTrack.user.avatar_url || 'https://via.placeholder.com/40';

	return (
		<>
			<Image source={{ uri: artworkUrl }} style={styles.artwork} />
			<View style={styles.info}>
				<Text style={styles.title} numberOfLines={1}>
					{currentTrack.title}
				</Text>
				<Text style={styles.artist} numberOfLines={1}>
					{currentTrack.user.username}
				</Text>
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
