import React from 'react';
import { View } from 'react-native';
import { Button } from '@/shared/theme/components/Button';
import { ShareLinkButton } from '@/shared/theme/components/ShareLinkButton';
import { userLink } from '@/shared/share-links/shareLinks';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { UserProfileHeaderProps } from '@/features/user/features/friends/types';
import { createUserProfileHeaderStyles } from '@/features/user/features/friends/features/user-profile/lib/userProfileHeaderStyles';
import { createUserProfileStyles } from '@/features/user/features/friends/features/user-profile/lib/userProfileStyles';
import { UserProfileListening } from './UserProfileListening';
import { Text } from '@/shared/theme/components/Text';

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

			{canControlMusic && followStatus?.isFriend && !isListeningLoading && (
				<UserProfileListening
					devices={devices}
					onRemotePlay={onRemotePlay}
					onRemotePause={onRemotePause}
				/>
			)}
		</>
	);
}
