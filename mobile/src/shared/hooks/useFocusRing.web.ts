import { useEffect } from 'react';

// The project compiles without the DOM library, so the parts of the document used here are typed.
interface StyleElement {
	id: string;
	textContent: string | null;
}

interface BrowserDocument {
	getElementById(id: string): StyleElement | null;
	createElement(tag: 'style'): StyleElement;
	head: { appendChild(element: StyleElement): void };
}

const browser = globalThis as unknown as { document?: BrowserDocument };
const STYLE_ID = 'zumik-focus-ring';

/** `:focus-visible` rings the keyboard focus (Tab); a text field draws its focus on its own frame. */
const focusRingCss = (color: string) =>
	`:focus-visible { outline: 2px solid ${color}; outline-offset: 2px; } input:focus, textarea:focus { outline: none; }`;

export function useFocusRing(color: string): void {
	useEffect(() => {
		const document = browser.document;
		if (!document) return;
		let style = document.getElementById(STYLE_ID);
		if (!style) {
			style = document.createElement('style');
			style.id = STYLE_ID;
			document.head.appendChild(style);
		}
		style.textContent = focusRingCss(color);
	}, [color]);
}
