export type DebouncedText = {
	text: string;
	settled: string;
	pending: boolean;
	change: (text: string) => void;
	clear: () => void;
};
