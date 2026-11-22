import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { formatDuration } from '@/shared/formatting/formatDuration';
import { TrackPhoneArtwork } from '@/features/playlists/features/editor/features/detail/components/presenters/TrackPhoneArtwork';
import { TrackRowInfo } from '@/shared/theme/components/TrackRowInfo';
import { TrackPlayingIndicator } from '@/shared/theme/components/TrackPlayingIndicator';
import {
	rowAccessibility,
	rowLabel,
} from '@/features/playlists/features/editor/features/detail/lib/trackItemRow';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { Track } from '@/shared/tracks/types/trackTypes';
import type {
	TrackRowActions,
	TrackRowState,
} from '@/features/playlists/features/editor/features/detail/types/trackRowTypes';

type TrackPhoneButtonProps = {
	track: Track;
	state: TrackRowState;
	actions: TrackRowActions;
};

export function TrackPhoneButton({ track, state, actions }: TrackPhoneButtonProps) {
	const { styles } = useThemedStyles(createStyles);
	const showActions = actions.onShowActions;

	return (
		<Pressable
			onPress={actions.onPress}
			onLongPress={showActions ? () => showActions() : undefined}
			accessibilityLabel={rowLabel(track, state.unavailable)}
			accessibilityHint={showActions ? 'Appui long pour les actions du titre' : undefined}
			accessibilityState={rowAccessibility(state)}
			style={styles.trackPressable}
		>
			<TrackPhoneArtwork uri={track.albumArt} unavailable={state.unavailable} />
			<TrackRowInfo track={track} state={state} />
			<TrackPlayingIndicator state={state} />
			{track.durationMs ? (
				<Text style={styles.duration}>{formatDuration(track.durationMs)}</Text>
			) : null}
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		trackPressable: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.md,
		},
		duration: {
			fontSize: theme.typography.sizes.xsm,
			fontFamily: theme.typography.families.mono,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
