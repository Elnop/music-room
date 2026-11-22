import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { PreviewBadge } from '@/shared/theme/components/PreviewBadge';
import { formatDuration } from '@/shared/formatting/formatDuration';
import { isPreviewOnly } from '@/shared/tracks/lib/isPreviewOnly';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import { Text } from '@/shared/theme/components/Text';

type AddableTrackInfoProps = {
	track: SoundCloudTrack;
};

export function AddableTrackInfo({ track }: AddableTrackInfoProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.trackInfo}>
			<Text style={styles.trackTitle} numberOfLines={1}>
				{track.title}
			</Text>
			<Text style={styles.trackArtist} numberOfLines={1}>
				{track.user.username}
			</Text>
			<View style={styles.trackMeta}>
				{isPreviewOnly(track) && <PreviewBadge />}
				<Text style={styles.trackDuration}>{formatDuration(track.duration)}</Text>
			</View>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		trackInfo: { flex: 1, marginRight: theme.spacing.sm },
		trackMeta: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
		trackTitle: {
			fontSize: theme.typography.sizes.mlg,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xxsm,
		},
		trackArtist: {
			fontSize: theme.typography.sizes.smd,
			color: theme.colors.textSecondary,
			marginBottom: theme.spacing.xxs,
		},
		trackDuration: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
