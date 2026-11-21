const CODE_LENGTH = 6;

export const CODE_INPUT_MAX_LENGTH = 32;

interface CodeFillResult {
	code: string[];
	focusIndex: number | null;
}

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
	if (previous && digits.length === CODE_LENGTH + 1) {
		if (digits.startsWith(previous)) digits = digits.slice(1);
		else if (digits.endsWith(previous)) digits = digits.slice(0, -1);
	}
	if (!digits) return null;

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
