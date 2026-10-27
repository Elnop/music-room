import { renderHook } from '@testing-library/react-native';
import { originalTheme } from '@/shared/theme/original.theme';
import { useFocusRing } from './useFocusRing.web';

const PRIMARY = originalTheme.colors.primary;

describe('useFocusRing (web)', () => {
	const style = { id: '', textContent: null as string | null };

	beforeEach(() => {
		style.textContent = null;
		Object.assign(globalThis, {
			document: {
				getElementById: () => null,
				createElement: () => style,
				head: { appendChild: jest.fn() },
			},
		});
	});

	afterEach(() => {
		delete (globalThis as { document?: unknown }).document;
	});

	it('rings the keyboard focus in the theme colour', () => {
		renderHook(() => useFocusRing(PRIMARY));
		expect(style.textContent).toContain(`:focus-visible { outline: 2px solid ${PRIMARY};`);
	});

	it('leaves text fields to their own frame, without a second outline', () => {
		renderHook(() => useFocusRing(PRIMARY));
		expect(style.textContent).toContain('input:focus, textarea:focus { outline: none; }');
	});
});
