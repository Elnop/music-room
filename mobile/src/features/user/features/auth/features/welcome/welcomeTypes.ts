import type { ReactNode } from 'react';
import type { Animated } from 'react-native';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';

export type FloatingIconSpec = {
	id: string;
	size: number;
	top: number;
	left: number;
	delay: number;
	duration: number;
	rotateDirection: 1 | -1;
	floatRange: number;
};

export type FloatingIconMotion = {
	spec: FloatingIconSpec;
	translateY: Animated.AnimatedInterpolation<number>;
	rotate: Animated.AnimatedInterpolation<string>;
	scale: Animated.Value;
};

export type FloatingIconValues = {
	spec: FloatingIconSpec;
	float: Animated.Value;
	spin: Animated.Value;
	scale: Animated.Value;
};

export type LandingFeature = {
	title: string;
	description: string;
	icon: PixelIconSource;
};

export type ServerSettings = {
	shown: boolean;
	onToggle: () => void;
	field: ReactNode;
};

export type WelcomeActions = {
	onStart: () => void;
	onLogin: () => void;
	onOpenPrivacyPolicy: () => void;
	onOpenLink: (url: string) => void;
};
