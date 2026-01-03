import React, { useState } from 'react';
import {
	View,
	Text,
	Modal,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
} from 'react-native';
import { showError } from '@utils/toast';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@/themes/types';
import { usePlaylistStore } from '@/store/playlistStore';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import type { Track } from '@/types/track.types';

interface Props {
	visible: boolean;
	track: SoundCloudTrack | null;
	onClose: () => void;
}

// Helper to parse structured API errors
interface ApiError {
	success: false;
	error: {
		message: string;
		code: string;
		statusCode: number;
	};
}

function parseApiError(error: unknown): string {
	// Check if it's a structured API error
	if (error && typeof error === 'object' && 'error' in error) {
		const apiError = error as ApiError;
		if (apiError.error?.message) {
			// Handle specific error codes
			if (apiError.error.code === 'TRACK_DUPLICATE') {
				return 'This track is already in the playlist';
			}
			if (apiError.error.code === 'FORBIDDEN') {
				return "You don't have permission to add tracks to this playlist";
			}
			return apiError.error.message;
		}
	}

	// Fallback to standard Error message
	if (error instanceof Error) {
		return error.message;
	}

	return 'Failed to add track to playlist';
}

export function PlaylistSelectorModal({ visible, track, onClose }: Props) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const { playlists, addTrack } = usePlaylistStore();
	const [isAdding, setIsAdding] = useState(false);

	const handleSelectPlaylist = async (playlistId: string) => {
		if (!track || isAdding) return;

		if (__DEV__)
			console.log('🎵 [PlaylistSelector] Adding track to playlist', {
				trackId: track.id,
				trackTitle: track.title,
				playlistId,
				hasArtwork: !!track.artwork_url,
				hasUserAvatar: !!track.user.avatar_url,
			});

		setIsAdding(true);

		try {
			// Convert SoundCloud track to internal format
			const internalTrack = {
				id: '', // Temporary ID, backend will generate UUID
				title: track.title,
				artist: track.user.username,
				album: undefined, // SoundCloud tracks don't have albums
				// Send undefined instead of empty string for better validation
				albumArt: track.artwork_url || track.user.avatar_url || undefined,
				durationMs: track.duration,
				trackUri: track.permalink_url,
				// Send undefined instead of empty string
				previewUrl: undefined,
			};

			if (__DEV__)
				console.log('🎵 [PlaylistSelector] Converted track:', {
					...internalTrack,
					albumArt: internalTrack.albumArt ? 'present' : 'undefined',
				});

			await addTrack(playlistId, internalTrack as Track); // Type assertion needed due to id field

			if (__DEV__) console.log('🟢 [PlaylistSelector] Track added successfully');

			onClose();
		} catch (error) {
			console.error('🔴 [PlaylistSelector] Error adding track:', error);

			const errorMessage = parseApiError(error);

			showError(errorMessage);
		} finally {
			setIsAdding(false);
		}
	};

	return (
		<Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
			<View style={styles.overlay}>
				<View style={styles.modal}>
					<View style={styles.header}>
						<Text style={styles.title}>Add to Playlist</Text>
						<TouchableOpacity
							onPress={onClose}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<Text style={styles.closeIcon}>✕</Text>
						</TouchableOpacity>
					</View>

					{track && (
						<View style={styles.trackPreview}>
							<Text style={styles.trackTitle} numberOfLines={1}>
								{track.title}
							</Text>
							<Text style={styles.trackArtist} numberOfLines={1}>
								{track.user.username}
							</Text>
						</View>
					)}

					<FlatList
						data={playlists}
						keyExtractor={item => item.id}
						renderItem={({ item }) => (
							<TouchableOpacity
								style={[styles.playlistItem, isAdding && styles.playlistItemDisabled]}
								onPress={() => handleSelectPlaylist(item.id)}
								disabled={isAdding}
							>
								<View style={styles.playlistInfo}>
									<Text style={styles.playlistName}>{item.name}</Text>
									<Text style={styles.playlistTrackCount}>
										{item.trackCount} {item.trackCount === 1 ? 'track' : 'tracks'}
									</Text>
								</View>
								<Text style={styles.chevron}>›</Text>
							</TouchableOpacity>
						)}
						ListEmptyComponent={
							<View style={styles.emptyContainer}>
								<Text style={styles.emptyText}>No playlists available</Text>
								<Text style={styles.emptySubtext}>Create a playlist first</Text>
							</View>
						}
						style={styles.list}
					/>

					{isAdding && (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="small" color={theme.colors.primary} />
							<Text style={styles.loadingText}>Adding track...</Text>
						</View>
					)}

					<TouchableOpacity
						style={[styles.cancelButton, isAdding && styles.cancelButtonDisabled]}
						onPress={onClose}
						disabled={isAdding}
					>
						<Text style={styles.cancelButtonText}>Cancel</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		overlay: {
			flex: 1,
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			justifyContent: 'flex-end',
		},
		modal: {
			backgroundColor: theme.colors.background,
			borderTopLeftRadius: theme.borders.medium,
			borderTopRightRadius: theme.borders.medium,
			paddingTop: theme.spacing.lg,
			maxHeight: '80%',
		},
		header: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingHorizontal: theme.spacing.lg,
			marginBottom: theme.spacing.md,
		},
		title: {
			fontSize: 20,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.text,
		},
		closeIcon: {
			fontSize: 24,
			color: theme.colors.textSecondary,
		},
		trackPreview: {
			backgroundColor: theme.colors.surface,
			padding: theme.spacing.md,
			marginHorizontal: theme.spacing.lg,
			borderRadius: theme.borders.medium,
			marginBottom: theme.spacing.md,
		},
		trackTitle: {
			fontSize: 16,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xs,
		},
		trackArtist: {
			fontSize: 14,
			color: theme.colors.textSecondary,
		},
		list: {
			maxHeight: 400,
		},
		playlistItem: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			padding: theme.spacing.md,
			paddingHorizontal: theme.spacing.lg,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
		},
		playlistItemDisabled: {
			opacity: 0.5,
		},
		playlistInfo: {
			flex: 1,
		},
		playlistName: {
			fontSize: 16,
			fontWeight: theme.typography.weights.medium,
			color: theme.colors.text,
			marginBottom: theme.spacing.xs,
		},
		playlistTrackCount: {
			fontSize: 14,
			color: theme.colors.textSecondary,
		},
		chevron: {
			fontSize: 24,
			color: theme.colors.textSecondary,
		},
		emptyContainer: {
			padding: theme.spacing.xl,
			alignItems: 'center',
		},
		emptyText: {
			fontSize: 16,
			color: theme.colors.textSecondary,
			marginBottom: theme.spacing.xs,
		},
		emptySubtext: {
			fontSize: 14,
			color: theme.colors.textSecondary,
		},
		loadingContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			padding: theme.spacing.md,
			gap: theme.spacing.sm,
		},
		loadingText: {
			fontSize: 14,
			color: theme.colors.textSecondary,
			marginLeft: theme.spacing.sm,
		},
		cancelButton: {
			margin: theme.spacing.lg,
			padding: theme.spacing.md,
			backgroundColor: theme.colors.surface,
			borderRadius: theme.borders.medium,
			alignItems: 'center',
		},
		cancelButtonDisabled: {
			opacity: 0.5,
		},
		cancelButtonText: {
			fontSize: 16,
			color: theme.colors.text,
			fontWeight: theme.typography.weights.semibold,
		},
	});
