import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';
import EyeCrossSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/eye-cross-solid.svg';
import EyeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/eye-solid.svg';
import LockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/lock-solid.svg';
import PencilSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pencil-solid.svg';

type PlaylistBadgesProps = {
	playlist: PlaylistWithTracks;
};

export function PlaylistBadges({ playlist }: PlaylistBadgesProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const isPublic = playlist.visibility === 'public';
	const isOpen = playlist.editMode === 'open';

	return (
		<View style={styles.row}>
			<View
				style={[styles.badge, styles.visibility]}
				accessible
				accessibilityLabel={isPublic ? 'Publique' : 'Privée'}
			>
				<PixelIcon icon={isPublic ? EyeSolid : EyeCrossSolid} color={theme.colors.onColor} />
			</View>
			<View
				style={[styles.badge, styles.editing]}
				accessible
				accessibilityLabel={isOpen ? 'Ouverte à tous en édition' : 'Édition sur invitation'}
			>
				<PixelIcon icon={isOpen ? PencilSolid : LockSolid} color={theme.colors.onColor} />
			</View>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
		badge: {
			...pixelFrame(theme),
			width: theme.controls.headerBadge,
			height: theme.controls.headerBadge,
			alignItems: 'center',
			justifyContent: 'center',
		},
		visibility: { backgroundColor: theme.colors.primary },
		editing: { backgroundColor: theme.colors.people },
	});
	return styles;
}
