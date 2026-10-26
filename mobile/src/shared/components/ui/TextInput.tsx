import React from 'react';
import { TextInput as NativeTextInput } from 'react-native';
import { FONT_FAMILIES } from '@/shared/theme/fonts';

const BASE_FONT = { fontFamily: FONT_FAMILIES.regular };

/** Refs keep react-native's type: `useRef<TextInput>(null)`. */
export type TextInput = NativeTextInput;

export function TextInput({ style, ...rest }: React.ComponentPropsWithRef<typeof NativeTextInput>) {
	return <NativeTextInput style={[BASE_FONT, style]} {...rest} />;
}
