import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { type useAnimatedStyle } from 'react-native-reanimated';
import type { NowPlayingTrack } from '@/features/player/types';
import type { createStyles } from './playerModalStyles';
import { Text } from '@/shared/components/ui/Text';

interface PlayerTrackInfoProps {
	styles: ReturnType<typeof createStyles>;
	track: NowPlayingTrack | null;
	/** Fades the title while the artwork is swiped. */
	infoStyle: ReturnType<typeof useAnimatedStyle>;
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
	infoStyle,
	error,
	isRemote,
	colors,
}: PlayerTrackInfoProps) {
	return (
		<>
			<Animated.View style={[styles.trackInfo, infoStyle]}>
				<Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
					{track ? track.title : 'Rien en lecture'}
				</Text>
				<Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
					{track ? track.artist : 'Choisissez un titre pour commencer'}
				</Text>
			</Animated.View>

			{error && !isRemote && (
				<View style={[styles.errorContainer, { backgroundColor: colors.errorBg }]}>
					<Ionicons name="warning" size={16} color={colors.error} />
					<Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
				</View>
			)}
		</>
	);
}
