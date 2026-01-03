import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { usePlayer } from '@/contexts/PlayerContext';
import { usePlayerStore } from '@/store/playerStore';
import { usePlayerProgress } from '@/hooks/usePlayerProgress';

export function MiniPlayer() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = React.useMemo(() => createStyles(theme, insets), [theme, insets]);

	const { player } = usePlayer();
	const { currentTrack, playbackState, pause, resume, toggleModal } = usePlayerStore();
	const { progress } = usePlayerProgress();

	if (!currentTrack) {
		return null;
	}

	const isLoading = playbackState === 'loading';
	const isPlaying = playbackState === 'playing';
	const canInteract = playbackState === 'playing' || playbackState === 'paused';

	const artworkUrl =
		currentTrack.artwork_url || currentTrack.user.avatar_url || 'https://via.placeholder.com/40';

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
				<Image source={{ uri: artworkUrl }} style={styles.artwork} />
				<View style={styles.info}>
					<Text style={styles.title} numberOfLines={1}>
						{currentTrack.title}
					</Text>
					<Text style={styles.artist} numberOfLines={1}>
						{currentTrack.user.username}
					</Text>
				</View>

				<TouchableOpacity
					style={styles.playButton}
					onPress={handlePlayPause}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					disabled={isLoading}
				>
					{isLoading ? (
						<ActivityIndicator size="small" color="#FFFFFF" />
					) : (
						<Ionicons
							name={isPlaying ? 'pause' : 'play'}
							size={20}
							color="#FFFFFF"
							style={isPlaying ? undefined : { marginLeft: 2 }}
						/>
					)}
				</TouchableOpacity>
			</View>

			{/* Progress bar at the bottom of the mini player - always rendered to avoid layout shift */}
			<View style={styles.progressBarContainer}>
				<View
					style={[
						styles.progressBar,
						{
							width: `${progress}%`,
						},
					]}
				/>
			</View>
		</TouchableOpacity>
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
