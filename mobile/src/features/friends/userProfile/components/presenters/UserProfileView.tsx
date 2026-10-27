import React from 'react';
import { View, ScrollView } from 'react-native';
import { memberSinceLabel } from '@/shared/components/profile/ProfileInfoRows';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useContentColumn } from '@/shared/hooks/useContentColumn';
import { useTheme } from '@/shared/theme/ThemeContext';
import type {
	FilteredProfile,
	FollowStatus,
	FriendPlaylistSummary,
	FriendListeningDevice,
} from '@/features/friends/types';
import { UserProfileHeader } from './UserProfileHeader';
import { UserProfileListening } from './UserProfileListening';
import { UserProfileWideHeader } from './UserProfileWideHeader';
import { UserProfileWideSections } from './UserProfileWideSections';
import { UserProfilePlaylists } from './UserProfilePlaylists';
import { createUserProfileStyles } from './userProfileStyles';
import { Text } from '@/shared/components/ui/Text';

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
	bottomPadding: number;
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
	bottomPadding,
}: UserProfileViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createUserProfileStyles(theme), [theme]);
	const { isWide } = useBreakpoint();
	const column = useContentColumn();
	const isFriend = followStatus?.isFriend ?? false;
	const showsListening =
		canControlMusic && isFriend && !isListeningLoading && devices.some(d => Boolean(d.track));

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomPadding }]}
			>
				{isWide ? (
					<View style={column}>
						<UserProfileWideHeader
							userId={userId}
							profile={profile}
							followStatus={followStatus}
							isFollowLoading={isFollowLoading}
							onFollowToggle={onFollowToggle}
							canControlMusic={canControlMusic}
							hasDevicesOnline={devices.length > 0}
						/>
						<UserProfileWideSections
							profile={profile}
							isFriend={isFriend}
							playlists={playlists}
							onSelectPlaylist={onSelectPlaylist}
							listening={
								showsListening && (
									<UserProfileListening
										devices={devices}
										onRemotePlay={onRemotePlay}
										onRemotePause={onRemotePause}
									/>
								)
							}
						/>
					</View>
				) : (
					<>
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
							<Text style={styles.infoText}>
								Membre depuis {memberSinceLabel(profile.createdAt)}
							</Text>
						</View>
					</>
				)}
			</ScrollView>
		</View>
	);
}
