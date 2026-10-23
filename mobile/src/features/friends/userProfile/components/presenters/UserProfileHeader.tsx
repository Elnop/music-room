import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { UserProfileHeaderProps } from '@/features/friends/types';
import { UserProfileInfo } from './UserProfileInfo';
import { UserProfileActions } from './UserProfileActions';
import { createUserProfileStyles } from './userProfileStyles';

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
