import type { DomDocument, DomElement } from '@/features/events/features/event-form/types/domTypes';

export function element<T extends DomElement>(
	doc: DomDocument,
	tag: string,
	attributes: Record<string, string> = {},
): T {
	const node = doc.createElement(tag);
	for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
	return node as T;
}

export function button(
	doc: DomDocument,
	label: string,
	attributes: Record<string, string>,
): DomElement {
	const node = element(doc, 'button', attributes);
	node.textContent = label;
	return node;
}
