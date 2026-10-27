import { useEffect, useRef, type RefObject } from 'react';
import type { View } from 'react-native';

// The project compiles without the DOM library, so the element read here is typed.
interface TooltipElement {
	textContent: string | null;
	getAttribute(name: string): string | null;
	setAttribute(name: string, value: string): void;
	removeAttribute(name: string): void;
}

/** Icon fonts draw their glyphs as Private Use Area characters, which are no visible label. */
const ICON_GLYPHS = /[-]/g;

/** react-native-web drops the `title` prop, so the attribute is set on the element itself; no label, no tooltip. */
export function useIconTooltip(label: string | undefined): RefObject<View | null> {
	const ref = useRef<View>(null);

	// Every render: the content may switch between an icon and a text.
	useEffect(() => {
		const element = ref.current as unknown as TooltipElement | null;
		if (!element) return;
		const text = (element.textContent ?? '').replace(ICON_GLYPHS, '').trim();
		if (text || !label) element.removeAttribute('title');
		else if (element.getAttribute('title') !== label) element.setAttribute('title', label);
	});

	return ref;
}
