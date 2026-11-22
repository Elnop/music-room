import React from 'react';
import { HeaderBackButton } from '@react-navigation/elements';
import type { HeaderOptions } from '@react-navigation/elements';
import type {
	NativeStackHeaderProps,
	NativeStackNavigationOptions,
} from '@react-navigation/native-stack';

type HeaderLeft = HeaderOptions['headerLeft'];

type HeaderLeftProps = Parameters<NonNullable<HeaderLeft>>[0];

export function headerLeftFor(
	options: NativeStackNavigationOptions,
	back: NativeStackHeaderProps['back'],
	goBack: () => void,
): HeaderLeft {
	const { headerLeft, headerBackTitle } = options;
	if (typeof headerLeft === 'function') {
		return ({ label, ...props }: HeaderLeftProps) =>
			headerLeft({ ...props, label: headerBackTitle ?? label });
	}
	if (headerLeft !== undefined || !back) return headerLeft;
	return ({ label, ...props }: HeaderLeftProps) => (
		<HeaderBackButton {...props} label={headerBackTitle ?? label} onPress={goBack} />
	);
}
