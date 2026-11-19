import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Artwork } from '@/shared/components/media/Artwork';
import { Avatar } from '@/shared/components/media/Avatar';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { Text } from '@/shared/components/ui/Text';
import { pixelFrame } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Playlist, UserSummary } from '@/features/playlists/types';
import { ownerName } from '@/features/playlists/home/utils/playlistLabels';
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

const createStyles = (theme: Theme) =>
	StyleSheet.create({
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
