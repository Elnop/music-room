import { useMemo } from 'react';
import { useTheme } from './ThemeContext';
import type { Theme } from './types';

/** Rebuilds the styles when the theme changes: `const { styles, theme } = useThemedStyles(createStyles)`. */
export function useThemedStyles<T>(factory: (theme: Theme) => T): { styles: T; theme: Theme } {
	const { theme } = useTheme();
	const styles = useMemo(() => factory(theme), [factory, theme]);
	return { styles, theme };
}
