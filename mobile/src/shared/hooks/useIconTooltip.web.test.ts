import { renderHook } from '@testing-library/react-native';
import type { View } from 'react-native';
import { useIconTooltip } from './useIconTooltip.web';

const fakeElement = (textContent: string) => {
	const attributes = new Map<string, string>();
	return {
		textContent,
		getAttribute: (name: string) => attributes.get(name) ?? null,
		setAttribute: (name: string, value: string) => attributes.set(name, value),
		removeAttribute: (name: string) => attributes.delete(name),
	};
};

function renderOn(element: ReturnType<typeof fakeElement>, label: string | undefined) {
	const { result, rerender } = renderHook(
		({ text }: { text: string | undefined }) => useIconTooltip(text),
		{
			initialProps: { text: label },
		}
	);
	result.current.current = element as unknown as View;
	rerender({ text: label });
	return rerender;
}

describe('useIconTooltip (web)', () => {
	it('names an icon-only button after its label', () => {
		// U+F101: a glyph of the Ionicons font
		const element = fakeElement('');
		renderOn(element, 'Titre suivant');
		expect(element.getAttribute('title')).toBe('Titre suivant');
	});

	it('gives a button with a visible text no tooltip', () => {
		const element = fakeElement(' Lecture');
		renderOn(element, 'Lire la playlist');
		expect(element.getAttribute('title')).toBeNull();
	});

	it('removes the tooltip once the label is gone', () => {
		const element = fakeElement('');
		const rerender = renderOn(element, 'Fermer');
		rerender({ text: undefined });
		expect(element.getAttribute('title')).toBeNull();
	});
});
