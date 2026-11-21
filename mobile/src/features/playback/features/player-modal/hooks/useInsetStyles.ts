import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { ScreenInsets } from '@/features/playback/features/player-modal/playerModalTypes';

export function useInsetStyles<T>(factory: (theme: Theme, insets: ScreenInsets) => T) {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = useMemo(() => factory(theme, insets), [factory, theme, insets]);
	return { styles, theme };
}
