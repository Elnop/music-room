import { debounce } from './debounce';

describe('debounce', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it('runs once, with the last arguments, after the wait', () => {
		const fn = jest.fn();
		const debounced = debounce(fn, 500);

		debounced('a');
		jest.advanceTimersByTime(300);
		debounced('ab');
		jest.advanceTimersByTime(499);
		expect(fn).not.toHaveBeenCalled();

		jest.advanceTimersByTime(1);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith('ab');
	});

	it('drops the pending call on cancel', () => {
		const fn = jest.fn();
		const debounced = debounce(fn, 500);

		debounced('a');
		debounced.cancel();
		jest.advanceTimersByTime(1000);
		expect(fn).not.toHaveBeenCalled();
	});

	it('runs again after a cancel', () => {
		const fn = jest.fn();
		const debounced = debounce(fn, 500);

		debounced('a');
		debounced.cancel();
		debounced('b');
		jest.advanceTimersByTime(500);
		expect(fn).toHaveBeenCalledWith('b');
	});
});
