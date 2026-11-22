import { button, element } from '@/features/events/features/event-form/lib/domElements';
import type {
	DomDialog,
	DomDocument,
	DomInput,
} from '@/features/events/features/event-form/types/domTypes';

const CONFIRM = 'confirm';

function pad(value: number) {
	return String(value).padStart(2, '0');
}

export function toLocalInputValue(date: Date): string {
	const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalInputValue(value: string): Date | null {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function buildDialog(doc: DomDocument, current: Date) {
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
		button(doc, 'OK', { value: CONFIRM }),
	);
	Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: '12px' });
	Object.assign(actions.style, { display: 'flex', justifyContent: 'flex-end', gap: '8px' });
	form.append(input, actions);
	dialog.append(form);
	return { dialog, input };
}

export function pickDateTime(current: Date): Promise<Date | null> {
	const doc = (globalThis as unknown as { document: DomDocument }).document;
	const { dialog, input } = buildDialog(doc, current);

	return new Promise((resolve) => {
		dialog.addEventListener(
			'close',
			() => {
				const picked = dialog.returnValue === CONFIRM ? fromLocalInputValue(input.value) : null;
				dialog.remove();
				resolve(picked);
			},
			{ once: true },
		);
		doc.body.append(dialog);
		dialog.showModal();
	});
}
