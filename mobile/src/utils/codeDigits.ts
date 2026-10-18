export const CODE_LENGTH = 6;

/** Native length cap of a code box: well above CODE_LENGTH so a paste with
 * spaces or newlines reaches fillCodeDigits whole. */
export const CODE_INPUT_MAX_LENGTH = 32;

export interface CodeFillResult {
	code: string[];
	/** Box to focus next, or null to leave focus where it is. */
	focusIndex: number | null;
}

/**
 * Applies a box's new text to a 6-digit code: one typed digit, a paste or a
 * keyboard autofill. Digits spread from `index` onwards; anything else is
 * dropped. Returns null when the change must be ignored.
 */
export function fillCodeDigits(
	code: readonly string[],
	index: number,
	text: string
): CodeFillResult | null {
	if (text === '') {
		const next = [...code];
		next[index] = '';
		return { code: next, focusIndex: null };
	}

	const previous = code[index] ?? '';
	let digits = text.replace(/\D/g, '');
	// A whole code pasted next to the box's existing digit arrives with it,
	// before or after: keep only the pasted code.
	if (previous && digits.length === CODE_LENGTH + 1) {
		if (digits.startsWith(previous)) digits = digits.slice(1);
		else if (digits.endsWith(previous)) digits = digits.slice(0, -1);
	}
	if (!digits) return null;

	// A whole code, pasted or autofilled into any box, fills every box.
	if (digits.length >= CODE_LENGTH) {
		return { code: digits.slice(0, CODE_LENGTH).split(''), focusIndex: null };
	}

	const next = [...code];
	const room = CODE_LENGTH - index;
	const used = digits.slice(0, room);
	for (let i = 0; i < used.length; i++) {
		next[index + i] = used[i];
	}

	const after = index + used.length;
	return { code: next, focusIndex: after < CODE_LENGTH ? after : null };
}
