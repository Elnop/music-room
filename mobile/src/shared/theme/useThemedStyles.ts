import { useMemo } from 'react';
import { useTheme } from './ThemeContext';
import type { Theme } from './types';

/**
 * The theme, and the styles a module-level factory builds from it, rebuilt when
 * the theme changes: `const { styles, theme } = useThemedStyles(createStyles)`.
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): { styles: T; theme: Theme } {
	const { theme } = useTheme();
	const styles = useMemo(() => factory(theme), [factory, theme]);
	return { styles, theme };
}
