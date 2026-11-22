import { CODE_LENGTH } from '@/features/user/features/auth/shared/code-input/codeInputConfig';

type CodeFillResult = {
	code: string[];
	focusIndex: number | null;
};

function clearDigit(code: readonly string[], index: number): CodeFillResult {
	const next = [...code];
	next[index] = '';
	return { code: next, focusIndex: null };
}

function typedDigits(previous: string, text: string): string {
	const digits = text.replaceAll(/\D/gu, '');
	if (!previous || digits.length !== CODE_LENGTH + 1) return digits;
	if (digits.startsWith(previous)) return digits.slice(1);
	if (digits.endsWith(previous)) return digits.slice(0, -1);
	return digits;
}

function placeDigits(code: readonly string[], index: number, digits: string): CodeFillResult {
	const next = [...code];
	const used = digits.slice(0, CODE_LENGTH - index);
	for (let i = 0; i < used.length; i++) {
		next[index + i] = used[i];
	}
	const after = index + used.length;
	return { code: next, focusIndex: after < CODE_LENGTH ? after : null };
}

export function fillCodeDigits(
	code: readonly string[],
	index: number,
	text: string,
): CodeFillResult | null {
	if (text === '') return clearDigit(code, index);
	const digits = typedDigits(code[index] ?? '', text);
	if (!digits) return null;
	if (digits.length >= CODE_LENGTH) {
		return { code: digits.slice(0, CODE_LENGTH).split(''), focusIndex: null };
	}
	return placeDigits(code, index, digits);
}
