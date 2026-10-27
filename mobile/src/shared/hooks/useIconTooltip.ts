import type { RefObject } from 'react';
import type { View } from 'react-native';

/** Native platforms show no tooltip; the browser variant names icon-only buttons on hover. */
export function useIconTooltip(_label: string | undefined): RefObject<View | null> | undefined {
	return undefined;
}
