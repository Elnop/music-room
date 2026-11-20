import type { RefObject } from 'react';
import type { View } from 'react-native';

/** Native platforms show no tooltip. */
export function useIconTooltip(_label: string | undefined): RefObject<View | null> | undefined {
	return undefined;
}
