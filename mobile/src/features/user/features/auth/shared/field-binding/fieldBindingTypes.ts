import type { KeyboardTypeOptions } from 'react-native';

export type FieldBinding = {
	value: string;
	onChangeText: (text: string) => void;
	error?: string;
};

export type FieldSpec<K extends string> = {
	name: K;
	label: string;
	placeholder: string;
	keyboardType?: KeyboardTypeOptions;
	secureTextEntry?: boolean;
};
