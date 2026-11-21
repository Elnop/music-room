import type { ReactNode } from 'react';
import type { StyleProp, TextInputProps, TextStyle } from 'react-native';

export type InputFieldProps = Omit<TextInputProps, 'style'> & {
	leftIcon?: ReactNode;
	style?: StyleProp<TextStyle>;
	onEnter?: () => void;
};
