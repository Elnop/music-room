import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { FriendPlaylistSummary } from '@/features/user/features/friends/types';
import { FriendPlaylistCard } from '@/features/user/features/friends/features/user-profile/components/presenters/FriendPlaylistCard';
import { createUserProfileStyles } from '@/features/user/features/friends/features/user-profile/lib/userProfileStyles';
import { Text } from '@/shared/theme/components/Text';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type UserProfilePlaylistsProps = {
	playlists: FriendPlaylistSummary[];
	ownerName: string;
	onSelectPlaylist: (playlistId: string) => void;
};

export function UserProfilePlaylists({
	playlists,
	ownerName,
	onSelectPlaylist,
}: UserProfilePlaylistsProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createUserProfileStyles(theme), [theme]);

	return (
		<View style={styles.playlistsSection}>
			<Text style={styles.sectionTitle}>Playlists</Text>
			{playlists.length === 0 ? (
				<EmptyState
					icon={MusicSolid}
					style={styles.emptyPlaylists}
					message="Aucune playlist à afficher"
				/>
			) : (
				playlists.map(playlist => (
					<FriendPlaylistCard
						key={playlist.id}
						playlist={playlist}
						ownerName={ownerName}
						onPress={() => onSelectPlaylist(playlist.id)}
					/>
				))
			)}
		</View>
	);
}
