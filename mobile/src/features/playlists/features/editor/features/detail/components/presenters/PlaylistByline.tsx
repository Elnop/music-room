import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/shared/theme/components/Avatar';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { headerFacts } from '@/features/playlists/features/editor/features/detail/lib/headerFacts';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';
import { BylineCollaborators } from '@/features/playlists/features/editor/features/detail/components/presenters/BylineCollaborators';
import { Text } from '@/shared/theme/components/Text';

type PlaylistBylineProps = {
	playlist: PlaylistWithTracks;
};

export function PlaylistByline({ playlist }: PlaylistBylineProps) {
	const { styles } = useThemedStyles(createStyles);
	const { trackLabel, ownerName, collaboratorLabel } = headerFacts(playlist);

	return (
		<View style={styles.meta}>
			<Avatar uri={playlist.owner.avatarUrl} name={ownerName} size="sm" />
			<Text style={styles.owner} numberOfLines={1}>
				{ownerName}
			</Text>
			<Text style={styles.separator}>•</Text>
			<Text style={styles.secondary}>{trackLabel}</Text>
			{collaboratorLabel && <BylineCollaborators label={collaboratorLabel} />}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		meta: {
			flexDirection: 'row',
			alignItems: 'center',
			flexWrap: 'wrap',
			gap: theme.spacing.xs,
			marginTop: theme.spacing.md,
		},
		owner: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.text,
			fontFamily: theme.typography.families.semibold,
			marginLeft: theme.spacing.xs,
			flexShrink: 1,
		},
		separator: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginHorizontal: theme.spacing.xs,
		},
		secondary: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary },
	});
	return styles;
}
