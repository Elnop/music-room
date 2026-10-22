import React from 'react';
import { Switch, type SwitchProps } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

type ThemedSwitchProps = Omit<SwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'>;

/**
 * The app's switch: the theme's colours, with an off state that stays visible
 * on every background (#307).
 */
export function ThemedSwitch(props: ThemedSwitchProps) {
	const { theme } = useTheme();
	return (
		<Switch
			{...props}
			trackColor={{ false: theme.colors.borderLight, true: theme.colors.primary }}
			thumbColor="#FFFFFF"
			ios_backgroundColor={theme.colors.borderLight}
		/>
	);
}
