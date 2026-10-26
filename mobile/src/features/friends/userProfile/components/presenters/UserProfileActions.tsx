import React from 'react';
import { View } from 'react-native';
import { Button } from '@/shared/components/ui/Button';
import { ShareLinkButton } from '@/shared/components/sharing/ShareLinkButton';
import { NowPlayingInline } from '@/shared/components/media/NowPlayingInline';
import { userLink } from '@/shared/utils/shareLinks';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { UserProfileHeaderProps } from '@/features/friends/types';
import { createUserProfileHeaderStyles } from './userProfileHeaderStyles';
import { createUserProfileStyles } from './userProfileStyles';
import { Text } from '@/shared/components/ui/Text';

type UserProfileActionsProps = UserProfileHeaderProps;

export function UserProfileActions({
	userId,
	profile,
	followStatus,
	isFollowLoading,
	onFollowToggle,
	canControlMusic,
	devices,
	isListeningLoading,
	onRemotePlay,
	onRemotePause,
}: UserProfileActionsProps) {
	const { theme } = useTheme();
	const headerStyles = React.useMemo(() => createUserProfileHeaderStyles(theme), [theme]);
	const styles = React.useMemo(() => createUserProfileStyles(theme), [theme]);

	return (
		<>
			{followStatus && (
				<View style={headerStyles.actionButtons}>
					{followStatus.isFriend ? (
						<>
							<View style={headerStyles.friendBadge}>
								<Text style={headerStyles.friendBadgeText}>Amis</Text>
							</View>
							<Button
								variant="outline"
								onPress={onFollowToggle}
								loading={isFollowLoading}
								style={headerStyles.actionButton}
							>
								Abonné
							</Button>
						</>
					) : followStatus.isFollowing ? (
						<Button
							variant="outline"
							onPress={onFollowToggle}
							loading={isFollowLoading}
							style={headerStyles.fullWidthButton}
						>
							Abonné
						</Button>
					) : (
						<Button
							variant="primary"
							onPress={onFollowToggle}
							loading={isFollowLoading}
							style={headerStyles.fullWidthButton}
						>
							Suivre
						</Button>
					)}
				</View>
			)}

			<ShareLinkButton
				url={userLink(userId)}
				title={profile.displayName || profile.username}
				style={styles.shareButton}
			/>

			{canControlMusic &&
				followStatus?.isFriend &&
				!isListeningLoading &&
				devices
					.filter(d => Boolean(d.track))
					.map(deviceStatus => (
						<NowPlayingInline
							key={deviceStatus.device.deviceId}
							track={deviceStatus.track!}
							isPlaying={deviceStatus.isPlaying}
							onPlay={() => onRemotePlay(deviceStatus.device.deviceId)}
							onPause={() => onRemotePause(deviceStatus.device.deviceId)}
							controllable={deviceStatus.controllable}
						/>
					))}
		</>
	);
}
