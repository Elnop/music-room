export type DomElement = {
	textContent: string | null;
	style: Record<string, string>;
	setAttribute: (name: string, value: string) => void;
	append: (...children: DomElement[]) => void;
	remove: () => void;
};

export type DomInput = DomElement & {
	value: string;
};

export type DomDialog = DomElement & {
	returnValue: string;
	showModal: () => void;
	addEventListener: (type: 'close', listener: () => void, options: { once: boolean }) => void;
};

export type DomDocument = {
	body: DomElement;
	createElement: (tag: string) => DomElement;
};
