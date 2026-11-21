import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { useSeparatorColor } from '@/shared/theme/hooks/useSeparatorColor';
import { createModalStyles } from '@/features/playback/features/queue-modal/lib/createModalStyles';

export function useQueueModalStyles() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const separator = useSeparatorColor();
	return useMemo(() => createModalStyles(theme, insets, separator), [theme, insets, separator]);
}
