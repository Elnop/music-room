import type { KeyboardShortcut } from './keyboardShortcuts';

/** Native platforms have no keyboard shortcuts. */
export function useKeyboardShortcuts(_shortcuts: readonly KeyboardShortcut[]): void {}
