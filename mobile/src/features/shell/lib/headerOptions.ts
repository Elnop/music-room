import type { HeaderOptions } from '@react-navigation/elements';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

const STACK_ONLY_OPTIONS: readonly string[] = [
	'header',
	'headerShown',
	'headerBackIcon',
	'headerBackImageSource',
	'presentation',
	'contentStyle',
	'headerLeft',
	'headerBackTitle',
];

export function headerOptions(options: NativeStackNavigationOptions): HeaderOptions {
	return Object.fromEntries(
		Object.entries(options).filter(([key]) => !STACK_ONLY_OPTIONS.includes(key)),
	) as HeaderOptions;
}
