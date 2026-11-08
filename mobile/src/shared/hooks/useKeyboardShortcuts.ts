import type { KeyboardShortcut } from '@/shared/utils/keyboardShortcuts';

/** Native platforms have no keyboard shortcuts. */
export function useKeyboardShortcuts(_shortcuts: readonly KeyboardShortcut[]): void {}
