import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type {
	FilteredProfile,
	FollowStatus,
	FriendPlaylistSummary,
	FriendListeningDevice,
} from '@/features/friends/types';
import { UserProfileHeader } from './UserProfileHeader';
import { UserProfilePlaylists } from './UserProfilePlaylists';
import { createUserProfileStyles } from './userProfileStyles';

interface UserProfileViewProps {
	userId: string;
	profile: FilteredProfile;
	followStatus: FollowStatus | null;
	playlists: FriendPlaylistSummary[];
	isFollowLoading: boolean;
	onFollowToggle: () => void;
	canControlMusic: boolean;
	devices: FriendListeningDevice[];
	isListeningLoading: boolean;
	onRemotePlay: (deviceId: string) => void;
	onRemotePause: (deviceId: string) => void;
	onSelectPlaylist: (playlistId: string) => void;
	playerHeight: number;
}

export function UserProfileView({
	userId,
	profile,
	followStatus,
	playlists,
	isFollowLoading,
	onFollowToggle,
	canControlMusic,
	devices,
	isListeningLoading,
	onRemotePlay,
	onRemotePause,
	onSelectPlaylist,
	playerHeight,
}: UserProfileViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createUserProfileStyles(theme), [theme]);

	const memberSince = new Date(profile.createdAt).toLocaleDateString('fr-FR', {
		month: 'long',
		year: 'numeric',
	});

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={[
					styles.contentContainer,
					{ paddingBottom: playerHeight + theme.spacing.xl },
				]}
			>
				<UserProfileHeader
					userId={userId}
					profile={profile}
					followStatus={followStatus}
					isFollowLoading={isFollowLoading}
					onFollowToggle={onFollowToggle}
					canControlMusic={canControlMusic}
					devices={devices}
					isListeningLoading={isListeningLoading}
					onRemotePlay={onRemotePlay}
					onRemotePause={onRemotePause}
				/>

				<UserProfilePlaylists
					playlists={playlists}
					ownerName={profile.username}
					onSelectPlaylist={onSelectPlaylist}
				/>

				<View style={styles.infoSection}>
					<Text style={styles.infoText}>Membre depuis {memberSince}</Text>
				</View>
			</ScrollView>
		</View>
	);
}
