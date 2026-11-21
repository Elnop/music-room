import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { UserProfileHeaderProps } from '@/features/user/features/friends/types';
import { UserProfileInfo } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileInfo';
import { UserProfileActions } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileActions';
import { createUserProfileStyles } from '@/features/user/features/friends/features/user-profile/lib/userProfileStyles';

export function UserProfileHeader(props: UserProfileHeaderProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createUserProfileStyles(theme), [theme]);

	return (
		<View style={styles.header}>
			<UserProfileInfo
				profile={props.profile}
				followStatus={props.followStatus}
				canControlMusic={props.canControlMusic}
				hasDevicesOnline={props.devices.length > 0}
			/>
			<UserProfileActions {...props} />
		</View>
	);
}
