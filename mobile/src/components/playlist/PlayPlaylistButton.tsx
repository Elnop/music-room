import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import { usePlayerStore } from '@store/playerStore';
import { useActiveQueue, useQueueStore } from '@store/queueStore';
import { selectPlaysPlaylist } from '@store/queueSelectors';
import { showInfo } from '@utils/toast';
import type { Theme } from '@themes/types';

/** Diameter of the button; the screen's list leaves room for it. */
export const PLAY_PLAYLIST_BUTTON_SIZE = 56;

interface PlayPlaylistButtonProps {
	playlistId: string;
	/** Hidden when the playlist has no track. */
	trackCount: number;
}

/**
 * Floating Play/Pause button of a playlist (#277), above the mini player and
 * the tab bar. Play queues the playlist as a block and plays its first track;
 * while this device plays an item queued from this playlist it pauses and
 * resumes the audio without any request.
 */
export function PlayPlaylistButton({ playlistId, trackCount }: PlayPlaylistButtonProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const playerHeight = usePlayerHeight();
	const queueItemId = usePlayerStore(state => state.queueItemId);
	const playbackState = usePlayerStore(state => state.playbackState);
	const pause = usePlayerStore(state => state.pause);
	const resume = usePlayerStore(state => state.resume);
	const playPlaylist = useQueueStore(state => state.playPlaylist);
	const fromPlaylist = selectPlaysPlaylist(useActiveQueue(), queueItemId, playlistId);
	const [pending, setPending] = React.useState(false);
	// Guards a second tap before the re-render that disables the button.
	const pendingRef = React.useRef(false);

	if (trackCount === 0) return null;

	const loading =
		pending || (fromPlaylist && (playbackState === 'loading' || playbackState === 'ready'));
	const playing = fromPlaylist && playbackState === 'playing';
	const paused = fromPlaylist && playbackState === 'paused';

	const handlePress = async () => {
		if (pendingRef.current) return;
		if (playing) {
			pause();
			return;
		}
		if (paused) {
			resume();
			return;
		}
		pendingRef.current = true;
		setPending(true);
		try {
			const outcome = await playPlaylist(playlistId);
			if (outcome === 'ignored') showInfo('Une action est déjà en cours');
		} finally {
			pendingRef.current = false;
			setPending(false);
		}
	};

	return (
		<Pressable
			style={({ pressed }) => [
				styles.fab,
				{ bottom: playerHeight + theme.spacing.md },
				pressed && styles.pressed,
			]}
			onPress={handlePress}
			disabled={loading}
			accessibilityRole="button"
			accessibilityLabel={playing ? 'Mettre la playlist en pause' : 'Lire la playlist'}
			accessibilityState={{ busy: loading, disabled: loading }}
		>
			{loading ? (
				<ActivityIndicator color={theme.colors.textInverse} />
			) : (
				<Ionicons
					name={playing ? 'pause' : 'play'}
					size={28}
					color={theme.colors.textInverse}
					style={playing ? undefined : styles.playIcon}
				/>
			)}
		</Pressable>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		fab: {
			position: 'absolute',
			right: theme.spacing.lg,
			width: PLAY_PLAYLIST_BUTTON_SIZE,
			height: PLAY_PLAYLIST_BUTTON_SIZE,
			borderRadius: PLAY_PLAYLIST_BUTTON_SIZE / 2,
			backgroundColor: theme.colors.primary,
			justifyContent: 'center',
			alignItems: 'center',
			borderWidth: theme.borders.thick,
			borderColor: theme.colors.border,
			...theme.shadows.large,
		},
		pressed: {
			opacity: 0.8,
		},
		// The play glyph looks off-centre to the left in a circle.
		playIcon: {
			marginLeft: 3,
		},
	});
