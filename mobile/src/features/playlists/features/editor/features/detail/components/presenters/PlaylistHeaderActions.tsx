import React from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyButton } from '@/shared/theme/components/KeyButton';
import { ShareLinkButton } from '@/shared/theme/components/ShareLinkButton';
import { Text } from '@/shared/theme/components/Text';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { playlistLink } from '@/shared/share-links/shareLinks';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';
import type { headerFacts } from '@/features/playlists/features/editor/features/detail/lib/headerFacts';
import PlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/plus-solid.svg';

type PlaylistHeaderActionsProps = {
	playlist: PlaylistWithTracks;
	facts: ReturnType<typeof headerFacts>;
	playButton: React.ReactNode;
	onAddTrack?: () => void;
};

export function PlaylistHeaderActions({
	playlist,
	facts,
	playButton,
	onAddTrack,
}: PlaylistHeaderActionsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.actions}>
			{facts.trackCount > 0 && playButton}
			{onAddTrack && (
				<KeyButton icon={PlusSolid} onPress={onAddTrack} accessibilityLabel="Ajouter un titre" />
			)}
			<ShareLinkButton url={playlistLink(playlist.id)} title={playlist.name} />
			<Text style={styles.count} accessibilityLabel={facts.trackLabel}>
				{facts.trackCount} · {facts.duration}
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		actions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
		count: {
			flex: 1,
			textAlign: 'right',
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.mono,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
