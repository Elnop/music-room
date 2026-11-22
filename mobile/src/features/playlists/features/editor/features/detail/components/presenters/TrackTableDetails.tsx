import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { formatDuration } from '@/shared/formatting/formatDuration';
import { createTrackTableColumns } from '@/features/playlists/features/editor/features/detail/lib/createTrackTableColumns';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { Track } from '@/shared/tracks/types/trackTypes';

type TrackTableDetailsProps = {
	track: Track;
	unavailable: boolean;
};

export function TrackTableDetails({ track, unavailable }: TrackTableDetailsProps) {
	const { styles } = useThemedStyles(createStyles);
	const columns = useThemedStyles(createTrackTableColumns).styles;

	return (
		<>
			<View style={[columns.artist, unavailable && styles.unavailable]}>
				<Text style={styles.secondary} numberOfLines={1}>
					{unavailable ? `Indisponible · ${track.artist}` : track.artist}
				</Text>
			</View>
			<View style={columns.duration}>
				{track.durationMs ? (
					<Text style={styles.secondary}>{formatDuration(track.durationMs)}</Text>
				) : null}
			</View>
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		secondary: { fontSize: theme.typography.sizes.smd, color: theme.colors.textSecondary },
		unavailable: { opacity: 0.4 },
	});
	return styles;
}
