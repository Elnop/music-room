import React from 'react';
import { TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { CODE_INPUT_MAX_LENGTH } from '@/features/auth/utils/codeDigits';

interface CodeInputProps {
	digits: string[];
	setBoxRef: (index: number) => (input: TextInput | null) => void;
	onChangeDigit: (index: number, text: string) => void;
	onKeyPress: (index: number, key: string) => void;
	containerStyle: StyleProp<ViewStyle>;
	/** Style of a box, by whether it holds a digit. */
	boxStyle: (filled: boolean) => StyleProp<TextStyle>;
	autoFocus?: boolean;
	editable?: boolean;
}

/** Six one-digit boxes; the first one accepts a pasted or autofilled code. */
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
	return (
		<View style={containerStyle}>
			{digits.map((digit, index) => (
				<TextInput
					key={index}
					ref={setBoxRef(index)}
					style={boxStyle(digit !== '')}
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
