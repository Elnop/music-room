import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { displayText } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';
import { headerFacts } from '@/features/playlists/features/editor/features/detail/lib/headerFacts';
import { PlaylistCover } from '@/features/playlists/features/editor/features/detail/components/presenters/PlaylistCover';
import { PlaylistBadges } from '@/features/playlists/features/editor/features/detail/components/presenters/PlaylistBadges';
import { PlaylistPeople } from '@/features/playlists/features/editor/features/detail/components/presenters/PlaylistPeople';
import { PlaylistHeaderActions } from '@/features/playlists/features/editor/features/detail/components/presenters/PlaylistHeaderActions';

type PlaylistHeaderProps = {
	playlist: PlaylistWithTracks;
	playButton: React.ReactNode;
	canEdit: boolean;
	onAddTrack: () => void;
};

export function PlaylistHeader({ playlist, playButton, canEdit, onAddTrack }: PlaylistHeaderProps) {
	const { styles } = useThemedStyles(createStyles);
	const facts = headerFacts(playlist);

	return (
		<View style={styles.container}>
			<View style={styles.top}>
				<PlaylistCover playlist={playlist} size={128} />
				<View style={styles.side}>
					<Text style={styles.name}>{playlist.name}</Text>
					<PlaylistBadges playlist={playlist} />
					<PlaylistPeople playlist={playlist} facts={facts} />
				</View>
			</View>
			{Boolean(playlist.description) && (
				<Text style={styles.description}>{playlist.description}</Text>
			)}
			<PlaylistHeaderActions
				playlist={playlist}
				facts={facts}
				playButton={playButton}
				onAddTrack={canEdit ? onAddTrack : undefined}
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: { padding: theme.spacing.md, gap: theme.spacing.md },
		top: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.md },
		side: { flex: 1, gap: theme.spacing.sm },
		name: {
			...displayText(theme, theme.typography.sizes.xxl),
			color: theme.colors.text,
			textShadowColor: theme.colors.shadow,
			textShadowOffset: { width: theme.borders.thick, height: theme.borders.thick },
			textShadowRadius: 0,
		},
		description: { fontSize: theme.typography.sizes.md, color: theme.colors.textSecondary },
	});
	return styles;
}
