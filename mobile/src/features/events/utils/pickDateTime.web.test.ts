import {
	fromLocalInputValue,
	pickDateTime,
	toLocalInputValue,
} from '@/features/events/utils/pickDateTime.web';

interface FakeNode {
	tag: string;
	attributes: Record<string, string>;
	children: FakeNode[];
	style: Record<string, string>;
	textContent: string | null;
	value: string;
	returnValue: string;
	removed: boolean;
	onClose?: () => void;
	setAttribute: (name: string, value: string) => void;
	append: (...nodes: FakeNode[]) => void;
	remove: () => void;
	showModal: () => void;
	addEventListener: (type: string, listener: () => void) => void;
}

function fakeNode(tag: string): FakeNode {
	const node: FakeNode = {
		tag,
		attributes: {},
		children: [],
		style: {},
		textContent: null,
		value: '',
		returnValue: '',
		removed: false,
		setAttribute: (name, value) => {
			node.attributes[name] = value;
		},
		append: (...nodes) => node.children.push(...nodes),
		remove: () => {
			node.removed = true;
		},
		showModal: jest.fn(),
		addEventListener: (_type, listener) => {
			node.onClose = listener;
		},
	};
	return node;
}

const find = (root: FakeNode, tag: string): FakeNode[] =>
	root.children.flatMap(child => [...(child.tag === tag ? [child] : []), ...find(child, tag)]);

let body: FakeNode;

beforeEach(() => {
	body = fakeNode('body');
	Object.assign(globalThis, { document: { body, createElement: fakeNode } });
});

afterEach(() => {
	delete (globalThis as { document?: unknown }).document;
});

/** Opens the picker and returns its dialog, its field, and a way to close it. */
function open(current: Date) {
	const picked = pickDateTime(current);
	const [dialog] = body.children;
	const [input] = find(dialog, 'input');
	const close = (returnValue: string) => {
		dialog.returnValue = returnValue;
		dialog.onClose?.();
		return picked;
	};
	return { dialog, input, close };
}

describe('pickDateTime (web)', () => {
	it('round-trips a local date through the datetime-local value', () => {
		const date = new Date(2026, 10, 6, 20, 5);
		expect(toLocalInputValue(date)).toBe('2026-11-06T20:05');
		expect(fromLocalInputValue('2026-11-06T20:05')).toEqual(date);
		expect(fromLocalInputValue('')).toBeNull();
		expect(fromLocalInputValue('not a date')).toBeNull();
	});

	it('opens a modal datetime-local field set to the current value', () => {
		const { dialog, input } = open(new Date(2026, 10, 6, 20, 0));

		expect(dialog.showModal).toHaveBeenCalled();
		expect(input.attributes.type).toBe('datetime-local');
		expect(input.value).toBe('2026-11-06T20:00');
		expect(find(dialog, 'button').map(button => button.textContent)).toEqual(['Annuler', 'OK']);
	});

	it('resolves the picked date on OK and removes the dialog', async () => {
		const { dialog, input, close } = open(new Date(2026, 10, 6, 20, 0));
		input.value = '2026-11-07T01:30';

		await expect(close('confirm')).resolves.toEqual(new Date(2026, 10, 7, 1, 30));
		expect(dialog.removed).toBe(true);
	});

	it.each([
		['Annuler', 'cancel'],
		['Escape', ''],
	])('resolves null on %s', async (_how, returnValue) => {
		const { dialog, close } = open(new Date());

		await expect(close(returnValue)).resolves.toBeNull();
		expect(dialog.removed).toBe(true);
	});
});
