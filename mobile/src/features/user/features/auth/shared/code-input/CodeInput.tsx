import React from 'react';
import { View } from 'react-native';
import type { TextInput as NativeTextInput, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { CODE_INPUT_MAX_LENGTH } from '@/features/user/features/auth/shared/code-input/codeDigits';
import { TextInput } from '@/shared/theme/components/TextInput';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { focusedFieldStyle } from '@/shared/theme/lib/focusedFieldStyle';

interface CodeInputProps {
	digits: string[];
	setBoxRef: (index: number) => (input: NativeTextInput | null) => void;
	onChangeDigit: (index: number, text: string) => void;
	onKeyPress: (index: number, key: string) => void;
	containerStyle: StyleProp<ViewStyle>;
	boxStyle: (filled: boolean) => StyleProp<TextStyle>;
	autoFocus?: boolean;
	editable?: boolean;
}

export function CodeInput({
	digits,
	setBoxRef,
	onChangeDigit,
	onKeyPress,
	containerStyle,
	boxStyle,
	autoFocus,
	editable,
}: CodeInputProps) {
	const { theme } = useTheme();
	const focusedStyle = focusedFieldStyle(theme.colors.primary);
	return (
		<View style={containerStyle}>
			{digits.map((digit, index) => (
				<TextInput
					key={index}
					ref={setBoxRef(index)}
					style={boxStyle(digit !== '')}
					focusedStyle={focusedStyle}
					value={digit}
					onChangeText={text => onChangeDigit(index, text)}
					onKeyPress={({ nativeEvent: { key } }) => onKeyPress(index, key)}
					keyboardType="number-pad"
					maxLength={CODE_INPUT_MAX_LENGTH}
					autoComplete={index === 0 ? 'sms-otp' : 'off'}
					textContentType={index === 0 ? 'oneTimeCode' : 'none'}
					selectTextOnFocus
					autoFocus={autoFocus && index === 0}
					editable={editable}
				/>
			))}
		</View>
	);
}
