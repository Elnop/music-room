import type { KeyboardShortcut } from '@/shared/keyboard-shortcuts/keyboardShortcuts';

/** Native platforms have no keyboard shortcuts. */
export function useKeyboardShortcuts(_shortcuts: readonly KeyboardShortcut[]): void {}
