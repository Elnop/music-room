import { useEffect, useRef } from 'react';
import { PANEL_CLOSE_ID, PANEL_ID } from '@/features/player/constants';

interface BrowserKeyEvent {
	key: string;
	defaultPrevented: boolean;
	preventDefault(): void;
}

interface BrowserElement {
	isConnected: boolean;
	focus(): void;
	contains(other: BrowserElement | null): boolean;
	addEventListener(type: 'keydown', listener: (event: BrowserKeyEvent) => void): void;
	removeEventListener(type: 'keydown', listener: (event: BrowserKeyEvent) => void): void;
}

interface BrowserDocument {
	activeElement: BrowserElement | null;
	body: BrowserElement;
	getElementById(id: string): BrowserElement | null;
}

const browser = globalThis as unknown as { document?: BrowserDocument };

export function usePanelFocus(onClose: () => void): void {
	const onCloseRef = useRef(onClose);
	useEffect(() => {
		onCloseRef.current = onClose;
	});

	useEffect(() => {
		const document = browser.document;
		const panel = document?.getElementById(PANEL_ID);
		if (!document || !panel) return;
		const opener = document.activeElement;
		document.getElementById(PANEL_CLOSE_ID)?.focus();
		const onKeyDown = (event: BrowserKeyEvent) => {
			if (event.key !== 'Escape' || event.defaultPrevented) return;
			event.preventDefault();
			onCloseRef.current();
		};
		panel.addEventListener('keydown', onKeyDown);
		return () => {
			panel.removeEventListener('keydown', onKeyDown);
			const active = document.activeElement;
			const lost = !active || active === document.body || panel.contains(active);
			if (lost && opener?.isConnected) opener.focus();
		};
	}, []);
}
