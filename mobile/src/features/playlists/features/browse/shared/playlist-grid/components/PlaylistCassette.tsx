import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Artwork } from '@/shared/theme/components/Artwork';
import { Avatar } from '@/shared/theme/components/Avatar';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Playlist, UserSummary } from '@/features/playlists/shared/playlist/lib/types';
import { ownerName } from '@/features/playlists/features/browse/shared/playlist-grid/lib/playlistLabels';
import EyeCrossSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/eye-cross-solid.svg';
import GlobeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/globe-solid.svg';
import LockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/lock-solid.svg';
import PencilSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pencil-solid.svg';

interface PlaylistCassetteProps {
	playlist: Playlist;
	owner?: UserSummary;
	width: number;
}

export function PlaylistCassette({ playlist, owner, width }: PlaylistCassetteProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const ink = theme.colors.textSecondary;

	return (
		<View style={{ width }}>
			<View style={styles.cover}>
				<Artwork
					uri={playlist.coverUrl || playlist.firstTrackCover}
					size={width - 6}
					iconSize={32}
				/>
			</View>
			<Text style={styles.name} numberOfLines={2}>
				{playlist.name}
			</Text>
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
		</View>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		cover: { ...pixelFrame(theme), backgroundColor: theme.colors.surfaceAlt },
		name: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.text,
			lineHeight: 18,
			height: 36,
			marginTop: theme.spacing.sm,
		},
		meta: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.sm,
			marginTop: theme.spacing.xs,
		},
	});
}
