import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { PreviewBadge } from '@/shared/theme/components/PreviewBadge';
import { isPreviewOnly } from '@/shared/tracks/lib/isPreviewOnly';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import { Text } from '@/shared/theme/components/Text';

type SoundCloudTrackInfoProps = {
	track: SoundCloudTrack;
};

export function SoundCloudTrackInfo({ track }: SoundCloudTrackInfoProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.info}>
			<Text style={styles.title} numberOfLines={1}>
				{track.title}
			</Text>
			<View style={styles.subtitle}>
				{isPreviewOnly(track) && <PreviewBadge />}
				<Text style={styles.artist} numberOfLines={1}>
					{track.user.username}
				</Text>
			</View>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		info: {
			flex: 1,
		},
		subtitle: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.xs,
		},
		title: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.text,
			marginBottom: theme.spacing.xxs,
		},
		artist: {
			flexShrink: 1,
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
