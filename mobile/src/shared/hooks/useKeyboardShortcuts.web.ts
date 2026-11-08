import { useEffect, useRef } from 'react';
import {
	matchShortcut,
	type KeyboardShortcut,
	type ShortcutKeyEvent,
} from '@/shared/utils/keyboardShortcuts';

interface BrowserKeyEvent extends ShortcutKeyEvent {
	defaultPrevented: boolean;
	preventDefault(): void;
}

interface BrowserDocument {
	addEventListener(type: 'keydown', listener: (event: BrowserKeyEvent) => void): void;
	removeEventListener(type: 'keydown', listener: (event: BrowserKeyEvent) => void): void;
	querySelector(selector: string): unknown;
}

const browser = globalThis as unknown as { document?: BrowserDocument };

const OPEN_DIALOG = '[aria-modal="true"]';

export function useKeyboardShortcuts(shortcuts: readonly KeyboardShortcut[]): void {
	const latestRef = useRef(shortcuts);
	useEffect(() => {
		latestRef.current = shortcuts;
	});

	useEffect(() => {
		const document = browser.document;
		if (!document) return;
		const onKeyDown = (event: BrowserKeyEvent) => {
			if (event.defaultPrevented || document.querySelector(OPEN_DIALOG)) return;
			const shortcut = matchShortcut(event, latestRef.current);
			if (!shortcut) return;
			event.preventDefault();
			shortcut.run();
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, []);
}
