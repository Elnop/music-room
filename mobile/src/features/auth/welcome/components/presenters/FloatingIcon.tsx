import React from 'react';
import { Animated } from 'react-native';
import type { FloatingIconMotion } from '@/features/auth/welcome/hooks/useFloatingIcons';
import appIcon from '@/assets/logo/app-icon.png';

export function FloatingIcon({ spec, translateY, rotate, scale }: FloatingIconMotion) {
	return (
		<Animated.Image
			source={appIcon}
			style={{
				position: 'absolute',
				width: spec.size,
				height: spec.size,
				top: spec.top,
				left: spec.left,
				opacity: 0.4,
				transform: [{ translateY }, { rotate }, { scale }],
			}}
			resizeMode="contain"
		/>
	);
}
