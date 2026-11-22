import React from 'react';
import { StyleSheet } from 'react-native';
import type { TextStyle } from 'react-native';
import { TextInput } from '@/shared/theme/components/TextInput';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { focusedFieldStyle } from '@/shared/theme/lib/focusedFieldStyle';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { CODE_INPUT_MAX_LENGTH } from '@/features/user/features/auth/shared/code-input/codeInputConfig';
import type {
	CodeBoxOptions,
	CodeInputState,
} from '@/features/user/features/auth/shared/code-input/codeInputTypes';

type CodeDigitBoxProps = {
	index: number;
	code: CodeInputState;
	onChangeDigit: (index: number, text: string) => void;
	options: CodeBoxOptions;
};

export function CodeDigitBox({ index, code, onChangeDigit, options }: CodeDigitBoxProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const digit = code.digits[index];
	const first = index === 0;

	return (
		<TextInput
			ref={code.setBoxRef(index)}
			style={[
				options.compact ? styles.compactBox : styles.box,
				digit ? styles.filled : styles.empty,
			]}
			focusedStyle={focusedFieldStyle(theme.colors.primary)}
			value={digit}
			onChangeText={(text) => onChangeDigit(index, text)}
			onKeyPress={({ nativeEvent: { key } }) => code.pressKey(index, key)}
			keyboardType="number-pad"
			maxLength={CODE_INPUT_MAX_LENGTH}
			autoComplete={first ? 'sms-otp' : 'off'}
			textContentType={first ? 'oneTimeCode' : 'none'}
			selectTextOnFocus
			autoFocus={options.autoFocus && first}
			editable={options.editable}
		/>
	);
}

function createStyles(theme: Theme) {
	const box: TextStyle = {
		borderWidth: theme.borders.double,
		fontSize: theme.typography.sizes.xxl,
		fontFamily: theme.typography.families.bold,
		textAlign: 'center',
		backgroundColor: theme.colors.surface,
		color: theme.colors.text,
	};
	const styles = StyleSheet.create({
		box: { ...box, width: theme.controls.codeBoxWidth, height: theme.controls.codeBoxHeight },
		compactBox: {
			...box,
			width: theme.controls.compactCodeBoxWidth,
			height: theme.controls.compactCodeBoxHeight,
		},
		filled: { borderColor: theme.colors.primary },
		empty: { borderColor: theme.colors.border },
	});
	return styles;
}
