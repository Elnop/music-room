export type CappedField = {
	value: string;
	onChangeText: (text: string) => void;
	error?: string;
	max: number;
};
