import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Artwork } from '@/shared/components/media/Artwork';
import type { NowPlayingTrack } from '@/features/player/types';
import { ARTWORK_SIZE, type createStyles } from './playerModalStyles';

interface PlayerTrackInfoProps {
	styles: ReturnType<typeof createStyles>;
	track: NowPlayingTrack | null;
	artworkUrl: string | null;
	error: string | null;
	isRemote: boolean;
	colors: {
		text: string;
		textSecondary: string;
		error: string;
		errorBg: string;
	};
}

export function PlayerTrackInfo({
	styles,
	track,
	artworkUrl,
	error,
	isRemote,
	colors,
}: PlayerTrackInfoProps) {
	return (
		<>
			<View style={styles.artworkWrapper}>
				<View style={styles.artworkShadow}>
					{track ? (
						<Artwork uri={artworkUrl} size={ARTWORK_SIZE} style={styles.artwork} iconSize={64} />
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
				<View style={[styles.errorContainer, { backgroundColor: colors.errorBg }]}>
					<Ionicons name="warning" size={16} color={colors.error} />
					<Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
				</View>
			)}
		</>
	);
}
