import React from 'react';
import { Animated } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { FloatingIconMotion } from '@/features/auth/welcome/hooks/useFloatingIcons';

export function FloatingIcon({ spec, translateY, rotate, scale }: FloatingIconMotion) {
	const { theme } = useTheme();
	return (
		<Animated.View
			style={{
				position: 'absolute',
				top: spec.top,
				left: spec.left,
				opacity: 0.4,
				transform: [{ translateY }, { rotate }, { scale }],
			}}
		>
			<PixelIcon name="note" size={spec.size} color={theme.colors.primary} />
		</Animated.View>
	);
}
