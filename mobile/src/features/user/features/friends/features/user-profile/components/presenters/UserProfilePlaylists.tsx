import React from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';
import type { ProfilePlaylists } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import { FriendPlaylistList } from '@/features/user/features/friends/features/user-profile/components/presenters/FriendPlaylistList';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type UserProfilePlaylistsProps = {
	playlists: ProfilePlaylists;
	ownerName: string;
};

export function UserProfilePlaylists({ playlists, ownerName }: UserProfilePlaylistsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.playlistsSection}>
			<Text style={styles.sectionTitle}>Playlists</Text>
			{playlists.items.length === 0 ? (
				<EmptyState
					icon={MusicSolid}
					style={styles.emptyPlaylists}
					message="Aucune playlist à afficher"
				/>
			) : (
				<FriendPlaylistList playlists={playlists} ownerName={ownerName} />
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		playlistsSection: {
			paddingTop: theme.spacing.lg,
			marginTop: theme.spacing.md,
		},
		sectionTitle: {
			fontSize: theme.typography.sizes.lgxl,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
			marginBottom: theme.spacing.md,
			paddingHorizontal: theme.spacing.md,
		},
		emptyPlaylists: {
			flex: 0,
			padding: theme.spacing.lg,
		},
	});
	return styles;
}
