import { useMemo } from 'react';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';

export function useThemedStyles<T>(factory: (theme: Theme) => T): { styles: T; theme: Theme } {
	const { theme } = useTheme();
	const styles = useMemo(() => factory(theme), [factory, theme]);
	return { styles, theme };
}
