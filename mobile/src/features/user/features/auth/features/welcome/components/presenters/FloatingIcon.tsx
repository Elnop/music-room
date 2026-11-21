import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { FloatingIconMotion } from '@/features/user/features/auth/features/welcome/welcomeTypes';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type FloatingIconProps = {
	motion: FloatingIconMotion;
};

function motionStyle({ spec, translateY, rotate, scale }: FloatingIconMotion) {
	return {
		top: spec.top,
		left: spec.left,
		transform: [{ translateY }, { rotate }, { scale }],
	};
}

export function FloatingIcon({ motion }: FloatingIconProps) {
	const { theme } = useTheme();

	return (
		<Animated.View style={[styles.icon, motionStyle(motion)]}>
			<PixelIcon icon={MusicSolid} size={motion.spec.size} color={theme.colors.primary} />
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	icon: {
		position: 'absolute',
		opacity: 0.4,
	},
});
