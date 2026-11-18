import { useMemo } from 'react';
import { useTheme } from './ThemeContext';
import type { Theme } from './types';

export function useThemedStyles<T>(factory: (theme: Theme) => T): { styles: T; theme: Theme } {
	const { theme } = useTheme();
	const styles = useMemo(() => factory(theme), [factory, theme]);
	return { styles, theme };
}
