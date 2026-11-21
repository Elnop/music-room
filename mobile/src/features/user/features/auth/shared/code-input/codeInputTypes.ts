import type { TextInput } from 'react-native';

export type CodeInputState = {
	digits: string[];
	isComplete: boolean;
	setBoxRef: (index: number) => (input: TextInput | null) => void;
	changeDigit: (index: number, text: string) => string | null;
	pressKey: (index: number, key: string) => void;
	focusFirst: () => void;
	reset: () => void;
};

export type CodeBoxOptions = {
	compact?: boolean;
	autoFocus?: boolean;
	editable?: boolean;
};

export type CodeBoxes = {
	setBoxRef: (index: number) => (input: TextInput | null) => void;
	focus: (index: number) => void;
	focusFirst: () => void;
};
