import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/shared/theme/components/Avatar';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';
import type { headerFacts } from '@/features/playlists/features/editor/features/detail/lib/headerFacts';
import UsersSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/users-solid.svg';

type PlaylistPeopleProps = {
	playlist: PlaylistWithTracks;
	facts: ReturnType<typeof headerFacts>;
};

export function PlaylistPeople({ playlist, facts }: PlaylistPeopleProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={styles.row}>
			<View accessible accessibilityLabel={facts.ownerName}>
				<Avatar uri={playlist.owner.avatarUrl} name={facts.ownerName} size="sm" />
			</View>
			{facts.collaboratorLabel && (
				<View style={styles.collaborators} accessible accessibilityLabel={facts.collaboratorLabel}>
					<PixelIcon icon={UsersSolid} size={12} color={theme.colors.people} />
					<Text style={styles.collaboratorCount}>{facts.collaborators}</Text>
				</View>
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
		collaborators: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
		collaboratorCount: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.mono,
			color: theme.colors.people,
		},
	});
	return styles;
}
