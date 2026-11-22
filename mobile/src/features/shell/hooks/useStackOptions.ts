import { useMemo } from 'react';
import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { headerTitle } from '@/shared/theme/lib/pixelFrame';
import { screenHeader } from '@/features/shell/screenLayout';

export function useStackOptions(): NativeStackNavigationOptions {
	const { theme } = useTheme();
	const { isWide } = useBreakpoint();
	return useMemo(
		() => ({
			...(isWide ? { header: screenHeader } : null),
			headerStyle: { backgroundColor: theme.colors.background },
			headerBlurEffect: Platform.OS === 'ios' ? 'systemMaterialDark' : undefined,
			headerTintColor: theme.colors.text,
			headerShadowVisible: false,
			headerTitleStyle: headerTitle(theme),
			headerTitleAlign: 'center',
		}),
		[theme, isWide],
	);
}
