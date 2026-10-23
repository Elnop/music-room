import React from 'react';
import { Switch, type SwitchProps } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

type ThemedSwitchProps = Omit<SwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'>;

/** The off state stays visible on every background. */
export function ThemedSwitch(props: ThemedSwitchProps) {
	const { theme } = useTheme();
	return (
		<Switch
			{...props}
			trackColor={{ false: theme.colors.borderLight, true: theme.colors.primary }}
			thumbColor={theme.colors.onColor}
			ios_backgroundColor={theme.colors.borderLight}
		/>
	);
}
