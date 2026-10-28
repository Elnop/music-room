import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/shared/components/media/Avatar';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { ShareLinkButton } from '@/shared/components/sharing/ShareLinkButton';
import { KeyButton } from '@/shared/components/ui/KeyButton';
import { Text } from '@/shared/components/ui/Text';
import { pixelFrame } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { playlistLink } from '@/shared/utils/shareLinks';
import type { PlaylistWithTracks } from '@/features/playlists/types';
import { headerFacts } from '@/features/playlists/detail/utils/headerFacts';
import { PlaylistCover } from './PlaylistCover';

interface PlaylistHeaderProps {
	playlist: PlaylistWithTracks;
	/** The Play/Pause button, shown next to the track count of a non-empty playlist. */
	playButton: React.ReactNode;
	/** An editor gets « Ajouter un titre ». */
	canEdit: boolean;
	onAddTrack: () => void;
}

export function PlaylistHeader({ playlist, playButton, canEdit, onAddTrack }: PlaylistHeaderProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const { trackCount, trackLabel, duration, ownerName, collaborators, collaboratorLabel } =
		headerFacts(playlist);
	const isPublic = playlist.visibility === 'public';
	const isOpen = playlist.editMode === 'open';

	return (
		<View style={styles.container}>
			<View style={styles.top}>
				<PlaylistCover playlist={playlist} size={128} />
				<View style={styles.side}>
					<Text style={styles.name}>{playlist.name}</Text>
					<View style={styles.row}>
						<View
							style={[styles.badge, styles.visibility]}
							accessible
							accessibilityLabel={isPublic ? 'Publique' : 'Privée'}
						>
							<PixelIcon name={isPublic ? 'eye' : 'eyeOff'} color={theme.colors.onColor} />
						</View>
						<View
							style={[styles.badge, styles.editing]}
							accessible
							accessibilityLabel={isOpen ? 'Ouverte à tous en édition' : 'Édition sur invitation'}
						>
							<PixelIcon name={isOpen ? 'pencil' : 'lock'} color={theme.colors.onColor} />
						</View>
					</View>
					<View style={styles.row}>
						<View accessible accessibilityLabel={ownerName}>
							<Avatar uri={playlist.owner.avatarUrl} name={ownerName} size="sm" />
						</View>
						{collaboratorLabel && (
							<View style={styles.collaborators} accessible accessibilityLabel={collaboratorLabel}>
								<PixelIcon name="crew" size={12} color={theme.colors.people} />
								<Text style={styles.collaboratorCount}>{collaborators}</Text>
							</View>
						)}
					</View>
				</View>
			</View>

			{!!playlist.description && <Text style={styles.description}>{playlist.description}</Text>}

			<View style={styles.actions}>
				{trackCount > 0 && playButton}
				{canEdit && <KeyButton icon="plus" onPress={onAddTrack} accessibilityLabel="Ajouter un titre" />}
				<ShareLinkButton url={playlistLink(playlist.id)} title={playlist.name} />
				<Text style={styles.count} accessibilityLabel={trackLabel}>
					{trackCount} · {duration}
				</Text>
			</View>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: { padding: theme.spacing.md, gap: theme.spacing.md },
		top: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.md },
		side: { flex: 1, gap: theme.spacing.sm },
		name: {
			fontSize: theme.typography.sizes.xxl,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
			textShadowColor: theme.colors.shadow,
			textShadowOffset: { width: theme.borders.thick, height: theme.borders.thick },
			textShadowRadius: 0,
		},
		row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
		badge: { ...pixelFrame(theme), width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
		visibility: { backgroundColor: theme.colors.primary },
		editing: { backgroundColor: theme.colors.people },
		collaborators: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
		collaboratorCount: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.mono,
			color: theme.colors.people,
		},
		description: { fontSize: theme.typography.sizes.md, color: theme.colors.textSecondary },
		actions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
		count: {
			flex: 1,
			textAlign: 'right',
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.mono,
			color: theme.colors.textSecondary,
		},
	});
