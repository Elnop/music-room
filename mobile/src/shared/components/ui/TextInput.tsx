import React from 'react';
import { TextInput as NativeTextInput, type StyleProp, type TextStyle } from 'react-native';
import { FONT_FAMILIES } from '@/shared/theme/fonts';
import { useFieldFocus } from '@/shared/hooks/useFieldFocus';

const BASE_FONT = { fontFamily: FONT_FAMILIES.regular };

export type TextInput = NativeTextInput;

type TextInputProps = React.ComponentPropsWithRef<typeof NativeTextInput> & {
	focusedStyle?: StyleProp<TextStyle>;
};

export function TextInput({ style, focusedStyle, onFocus, onBlur, ...rest }: TextInputProps) {
	const { focused, focusProps } = useFieldFocus({ onFocus, onBlur });
	return (
		<NativeTextInput
			style={[BASE_FONT, style, focused && focusedStyle]}
			{...rest}
			{...focusProps}
		/>
	);
}
