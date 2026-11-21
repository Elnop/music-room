export type KeyboardShortcut = {
	key: string;
	shift?: boolean;
	keys: string;
	description: string;
	run: () => void;
};

export type ShortcutKeyEvent = {
	key: string;
	shiftKey: boolean;
	ctrlKey: boolean;
	altKey: boolean;
	metaKey: boolean;
	target: ShortcutTarget | null;
};

export type ShortcutTarget = {
	tagName?: string;
	isContentEditable?: boolean;
	getAttribute?: (name: string) => string | null;
};
