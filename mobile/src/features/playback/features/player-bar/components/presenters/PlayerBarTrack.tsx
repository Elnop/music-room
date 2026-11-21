import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Artwork } from '@/shared/theme/components/Artwork';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';
import { PlayerBarTrackText } from '@/features/playback/features/player-bar/components/presenters/PlayerBarTrackText';
import type { PlayerBarPanel } from '@/features/playback/features/player-bar/playerBarTypes';

type PlayerBarTrackProps = {
	nowPlaying: NowPlaying;
	panel: PlayerBarPanel;
};

export function PlayerBarTrack({ nowPlaying, panel }: PlayerBarTrackProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.side}>
			<Pressable
				style={styles.trackButton}
				onPress={panel.onToggle}
				accessibilityLabel={panel.trackLabel}
				accessibilityState={{ expanded: panel.isOpen }}
			>
				<Artwork uri={nowPlaying.track?.artworkUrl} size={56} iconSize={24} />
				<PlayerBarTrackText nowPlaying={nowPlaying} />
			</Pressable>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		side: { flex: 1, flexBasis: 0, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
		trackButton: {
			flexDirection: 'row',
			alignItems: 'center',
			flexShrink: 1,
			minWidth: 0,
			gap: theme.spacing.sm,
		},
	});
	return styles;
}
