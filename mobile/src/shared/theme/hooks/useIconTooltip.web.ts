import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { View } from 'react-native';

interface TooltipElement {
	textContent: string | null;
	getAttribute(name: string): string | null;
	setAttribute(name: string, value: string): void;
	removeAttribute(name: string): void;
}

const ICON_GLYPHS = /[-]/gu;

export function useIconTooltip(label: string | undefined): RefObject<View | null> {
	const ref = useRef<View>(null);

	useEffect(() => {
		const element = ref.current as unknown as TooltipElement | null;
		if (!element) return;
		const text = (element.textContent ?? '').replaceAll(ICON_GLYPHS, '').trim();
		if (text || !label) element.removeAttribute('title');
		else if (element.getAttribute('title') !== label) element.setAttribute('title', label);
	});

	return ref;
}
