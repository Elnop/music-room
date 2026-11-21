import { Dimensions } from 'react-native';
import type { FloatingIconSpec } from '@/features/user/features/auth/features/welcome/welcomeTypes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const FLOATING_ICONS: FloatingIconSpec[] = [
	{
		id: 'top-left',
		size: 80,
		top: 60,
		left: 20,
		delay: 0,
		duration: 1200,
		rotateDirection: 1,
		floatRange: 35,
	},
	{
		id: 'top-right',
		size: 65,
		top: 120,
		left: SCREEN_WIDTH - 100,
		delay: 400,
		duration: 1400,
		rotateDirection: -1,
		floatRange: 30,
	},
	{
		id: 'middle-left',
		size: 70,
		top: SCREEN_HEIGHT * 0.45,
		left: 15,
		delay: 200,
		duration: 1100,
		rotateDirection: 1,
		floatRange: 40,
	},
	{
		id: 'middle-right',
		size: 75,
		top: SCREEN_HEIGHT * 0.55,
		left: SCREEN_WIDTH - 95,
		delay: 600,
		duration: 1300,
		rotateDirection: -1,
		floatRange: 32,
	},
];
