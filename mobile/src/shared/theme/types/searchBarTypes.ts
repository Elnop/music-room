import type { Ref } from 'react';
import type { TextInput } from 'react-native';

export type SearchBarInput = {
	inputRef?: Ref<TextInput>;
	autoFocus?: boolean;
};
