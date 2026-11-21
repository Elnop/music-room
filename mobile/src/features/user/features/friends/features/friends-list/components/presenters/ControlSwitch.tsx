import React from 'react';
import { View } from 'react-native';
import { LoadingSpinner } from '@/shared/theme/components/LoadingSpinner';
import { ThemedSwitch } from '@/shared/theme/components/ThemedSwitch';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { createFriendsListStyles } from '@/features/user/features/friends/features/friends-list/components/presenters/friendsListStyles';

type ControlSwitchProps = {
	canControl: boolean;
	isToggling: boolean;
	disabled: boolean;
	onToggle: () => void;
	accessibilityLabel: string;
};

export function ControlSwitch({
	canControl,
	isToggling,
	disabled,
	onToggle,
	accessibilityLabel,
}: ControlSwitchProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createFriendsListStyles(theme), [theme]);

	return isToggling ? (
		<View style={styles.switchPlaceholder}>
			<LoadingSpinner size="small" />
		</View>
	) : (
		<ThemedSwitch
			value={canControl}
			onValueChange={onToggle}
			disabled={disabled}
			accessibilityLabel={accessibilityLabel}
		/>
	);
}
