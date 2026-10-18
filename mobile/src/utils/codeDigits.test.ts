import { fillCodeDigits } from '@/utils/codeDigits';

const empty = ['', '', '', '', '', ''];

describe('fillCodeDigits', () => {
	it('fills one typed digit and moves to the next box', () => {
		expect(fillCodeDigits(empty, 0, '7')).toEqual({
			code: ['7', '', '', '', '', ''],
			focusIndex: 1,
		});
	});

	it('fills every box from a full paste', () => {
		expect(fillCodeDigits(empty, 0, '123456')).toEqual({
			code: ['1', '2', '3', '4', '5', '6'],
			focusIndex: null,
		});
	});

	it('fills every box from a full code pasted into a later box', () => {
		expect(fillCodeDigits(empty, 3, '123456')).toEqual({
			code: ['1', '2', '3', '4', '5', '6'],
			focusIndex: null,
		});
	});

	it('fills every box from a full code pasted into a filled box', () => {
		expect(fillCodeDigits(['9', '', '', '', '', ''], 0, '9123456')?.code).toEqual([
			'1',
			'2',
			'3',
			'4',
			'5',
			'6',
		]);
	});

	it('fills from the box that received a partial paste', () => {
		expect(fillCodeDigits(empty, 2, '12')).toEqual({
			code: ['', '', '1', '2', '', ''],
			focusIndex: 4,
		});
	});

	it('drops non-digits', () => {
		expect(fillCodeDigits(empty, 0, '12a4')?.code).toEqual(['1', '2', '4', '', '', '']);
	});

	it('ignores a lone letter', () => {
		expect(fillCodeDigits(empty, 0, 'a')).toBeNull();
	});

	it('ignores spaces in a pasted code', () => {
		expect(fillCodeDigits(empty, 0, '123 456')?.code).toEqual(['1', '2', '3', '4', '5', '6']);
	});

	it('keeps only the first six digits of an over-long paste', () => {
		expect(fillCodeDigits(empty, 0, '1234567')?.code).toEqual(['1', '2', '3', '4', '5', '6']);
	});

	it('stops at the last box when pasting near the end', () => {
		expect(fillCodeDigits(empty, 4, '987')?.code).toEqual(['', '', '', '', '9', '8']);
	});

	it('clears a box on backspace without moving focus', () => {
		expect(fillCodeDigits(['1', '2', '', '', '', ''], 1, '')).toEqual({
			code: ['1', '', '', '', '', ''],
			focusIndex: null,
		});
	});

	it('replaces the digit when typing over a selected digit', () => {
		expect(fillCodeDigits(['1', '', '', '', '', ''], 0, '9')?.code[0]).toBe('9');
	});

	it('spreads a two-digit paste into a filled box', () => {
		expect(fillCodeDigits(['1', '', '', '', '', ''], 0, '12')).toEqual({
			code: ['1', '2', '', '', '', ''],
			focusIndex: 2,
		});
	});

	it('drops the box digit stuck to a pasted full code', () => {
		expect(fillCodeDigits(['9', '', '', '', '', ''], 0, '9123456')?.code).toEqual([
			'1',
			'2',
			'3',
			'4',
			'5',
			'6',
		]);
	});
});
