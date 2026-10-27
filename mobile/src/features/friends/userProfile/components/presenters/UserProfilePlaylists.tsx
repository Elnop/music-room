import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { FriendPlaylistSummary } from '@/features/friends/types';
import { FriendPlaylistCard } from './FriendPlaylistCard';
import { createUserProfileStyles } from './userProfileStyles';
import { Text } from '@/shared/components/ui/Text';

interface UserProfilePlaylistsProps {
	playlists: FriendPlaylistSummary[];
	ownerName: string;
	onSelectPlaylist: (playlistId: string) => void;
}

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
					icon="musical-notes-outline"
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
