import React from 'react';
import { Animated } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { FloatingIconMotion } from '@/features/user/features/auth/features/welcome/useFloatingIcons';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

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
			<PixelIcon icon={MusicSolid} size={spec.size} color={theme.colors.primary} />
		</Animated.View>
	);
}
