import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LoadingSpinner } from '@/shared/theme/components/LoadingSpinner';
import { ThemedSwitch } from '@/shared/theme/components/ThemedSwitch';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { FriendControl } from '@/features/user/features/friends/features/friends-list/friendsListTypes';

type ControlSwitchProps = {
	friendId: string;
	control: FriendControl;
	accessibilityLabel: string;
};

export function ControlSwitch({ friendId, control, accessibilityLabel }: ControlSwitchProps) {
	const { styles } = useThemedStyles(createStyles);
	const canControl = control.canControl(friendId);

	return control.togglingUserId === friendId ? (
		<View style={styles.switchPlaceholder}>
			<LoadingSpinner size="small" />
		</View>
	) : (
		<ThemedSwitch
			value={canControl}
			onValueChange={() => control.onToggleControl(friendId, canControl)}
			disabled={Boolean(control.togglingUserId)}
			accessibilityLabel={accessibilityLabel}
		/>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		switchPlaceholder: {
			width: theme.controls.switchWidth,
			height: theme.controls.switchHeight,
			justifyContent: 'center',
			alignItems: 'center',
		},
	});
	return styles;
}
