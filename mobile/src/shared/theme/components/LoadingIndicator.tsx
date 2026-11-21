import React from 'react';
import { ActivityIndicator } from 'react-native';
import { EqualizerBars } from '@/shared/theme/components/EqualizerBars';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { LoadingSize, LoadingVariant } from '@/shared/theme/types/loadingTypes';

type LoadingIndicatorProps = {
	size: LoadingSize;
	variant: LoadingVariant;
};

export function LoadingIndicator({ size, variant }: LoadingIndicatorProps) {
	const { theme } = useTheme();
	const small = size === 'small';

	if (variant === 'spinner') {
		return <ActivityIndicator size={small ? 'small' : 'large'} color={theme.colors.primary} />;
	}
	return (
		<EqualizerBars
			color={theme.colors.primary}
			bars={small ? 3 : 5}
			barWidth={small ? 3 : 9}
			height={small ? 18 : 48}
		/>
	);
}
