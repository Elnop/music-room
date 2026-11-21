import React from 'react';
import { Switch } from 'react-native';
import type { SwitchProps } from 'react-native';
import { useTheme } from '@/shared/theme/components/ThemeContext';

type ThemedSwitchProps = Omit<SwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'>;

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
