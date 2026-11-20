import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Avatar } from '@/shared/theme/components/Avatar';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { headerFacts } from '@/features/playlists/features/editor/features/detail/lib/headerFacts';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/lib/types';
import { Text } from '@/shared/theme/components/Text';
import UsersSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/users-solid.svg';

export function PlaylistByline({ playlist }: { playlist: PlaylistWithTracks }) {
	const { styles, theme } = useThemedStyles(createStyles);
	const { trackLabel, ownerName, collaboratorLabel } = headerFacts(playlist);

	return (
		<View style={styles.meta}>
			<Avatar uri={playlist.owner.avatarUrl} name={ownerName} size="sm" />
			<Text style={styles.owner} numberOfLines={1}>
				{ownerName}
			</Text>
			<Text style={styles.separator}>•</Text>
			<Text style={styles.secondary}>{trackLabel}</Text>
			{collaboratorLabel && (
				<>
					<Text style={styles.separator}>•</Text>
					<PixelIcon icon={UsersSolid} size={14} color={theme.colors.primary} />
					<Text style={styles.collaborators}>{collaboratorLabel}</Text>
				</>
			)}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
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
		collaborators: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.primary,
			fontFamily: theme.typography.families.semibold,
		},
	});
