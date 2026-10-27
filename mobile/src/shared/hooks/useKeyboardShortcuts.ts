import type { KeyboardShortcut } from '@/shared/utils/keyboardShortcuts';

/** Native platforms have no hardware keyboard shortcuts; the browser variant listens to the page. */
export function useKeyboardShortcuts(_shortcuts: readonly KeyboardShortcut[]): void {}
