import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/shared/theme/components/Avatar';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Playlist, UserSummary } from '@/features/playlists/shared/playlist/playlistTypes';
import { ownerName } from '@/features/playlists/features/browse/shared/playlist-grid/lib/playlistLabels';
import EyeCrossSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/eye-cross-solid.svg';
import GlobeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/globe-solid.svg';
import LockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/lock-solid.svg';
import PencilSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pencil-solid.svg';

type PlaylistCassetteMetaProps = {
	playlist: Playlist;
	owner?: UserSummary;
};

export function PlaylistCassetteMeta({ playlist, owner }: PlaylistCassetteMetaProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const ink = theme.colors.textSecondary;

	return (
		<View style={styles.meta} importantForAccessibility="no-hide-descendants">
			<PixelIcon
				icon={playlist.visibility === 'public' ? GlobeSolid : EyeCrossSolid}
				size={12}
				color={ink}
			/>
			<PixelIcon
				icon={playlist.editMode === 'open' ? PencilSolid : LockSolid}
				size={12}
				color={ink}
			/>
			{owner && <Avatar uri={owner.avatarUrl} name={ownerName(owner)} size="sm" />}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		meta: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.sm,
			marginTop: theme.spacing.xs,
		},
	});
	return styles;
}
