import React from 'react';
import { View } from 'react-native';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { ThemedSwitch } from '@/shared/components/ui/ThemedSwitch';
import { useTheme } from '@/shared/theme/ThemeContext';
import { createFriendsListStyles } from './friendsListStyles';

interface ControlSwitchProps {
	canControl: boolean;
	isToggling: boolean;
	disabled: boolean;
	onToggle: () => void;
	accessibilityLabel: string;
}

/** Whether a friend may control my music; a spinner takes its place while the change is saved. */
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
