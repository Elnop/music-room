// The native picker has no web version: a modal <dialog> holds a `datetime-local` field.
// The project types no DOM (lib esnext), hence the few element shapes below.

interface DomElement {
	textContent: string | null;
	style: Record<string, string>;
	setAttribute: (name: string, value: string) => void;
	append: (...children: DomElement[]) => void;
	remove: () => void;
}

interface DomInput extends DomElement {
	value: string;
}

interface DomDialog extends DomElement {
	returnValue: string;
	showModal: () => void;
	addEventListener: (type: 'close', listener: () => void, options: { once: boolean }) => void;
}

interface DomDocument {
	body: DomElement;
	createElement: (tag: string) => DomElement;
}

const CONFIRM = 'confirm';

const pad = (value: number) => String(value).padStart(2, '0');

/** `datetime-local` takes the local time, without seconds or zone. */
export function toLocalInputValue(date: Date): string {
	const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Null for an empty or invalid value. A zoneless ISO date-time parses as local time. */
export function fromLocalInputValue(value: string): Date | null {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function element<T extends DomElement>(
	doc: DomDocument,
	tag: string,
	attributes: Record<string, string> = {}
): T {
	const node = doc.createElement(tag);
	for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
	return node as T;
}

function button(doc: DomDocument, label: string, attributes: Record<string, string>): DomElement {
	const node = element(doc, 'button', attributes);
	node.textContent = label;
	return node;
}

/** Null when the dialog is cancelled or closed with Escape. */
export function pickDateTime(current: Date): Promise<Date | null> {
	const doc = (globalThis as unknown as { document: DomDocument }).document;
	const dialog = element<DomDialog>(doc, 'dialog', { 'aria-label': 'Date et heure' });
	const form = element(doc, 'form', { method: 'dialog' });
	const input = element<DomInput>(doc, 'input', {
		type: 'datetime-local',
		required: '',
		'aria-label': 'Date et heure',
	});
	input.value = toLocalInputValue(current);
	const actions = element(doc, 'div');
	actions.append(
		button(doc, 'Annuler', { value: 'cancel', formnovalidate: '' }),
		button(doc, 'OK', { value: CONFIRM })
	);
	Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: '12px' });
	Object.assign(actions.style, { display: 'flex', justifyContent: 'flex-end', gap: '8px' });
	form.append(input, actions);
	dialog.append(form);

	return new Promise(resolve => {
		dialog.addEventListener(
			'close',
			() => {
				const picked = dialog.returnValue === CONFIRM ? fromLocalInputValue(input.value) : null;
				dialog.remove();
				resolve(picked);
			},
			{ once: true }
		);
		doc.body.append(dialog);
		dialog.showModal();
	});
}
