import { act, renderHook } from '@testing-library/react-native';
import type { View } from 'react-native';
import { renderGoogleButton } from '@/features/auth/services/googleSignIn.web';
import { preloadFacebookSdk } from '@/features/auth/services/facebookSignIn.web';
import { logger } from '@/shared/utils/logger';
import { useProviderButtons } from './useProviderButtons.web';

jest.mock('@/features/auth/services/googleSignIn.web', () => ({ renderGoogleButton: jest.fn() }));
jest.mock('@/features/auth/services/facebookSignIn.web', () => ({ preloadFacebookSdk: jest.fn() }));

const node = { offsetWidth: 320 } as unknown as View;
const render = jest.mocked(renderGoogleButton);

function attach(slot: ReturnType<typeof useProviderButtons>): (() => void) | void {
	if (!slot) throw new Error('no Google button slot');
	return slot(node);
}

beforeEach(() => {
	render.mockReset();
	jest.mocked(preloadFacebookSdk).mockReset();
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('useProviderButtons (web)', () => {
	it('preloads the Facebook SDK with the screen', () => {
		renderHook(() => useProviderButtons(jest.fn(), 'form'));

		expect(preloadFacebookSdk).toHaveBeenCalledTimes(1);
	});

	it('renders the Google button into the slot and calls the latest callback', async () => {
		const release = jest.fn();
		render.mockResolvedValue(release);
		const first = jest.fn();
		const latest = jest.fn();
		const { result, rerender } = renderHook(
			({ onCredential }: { onCredential: () => void }) => useProviderButtons(onCredential, 'row'),
			{ initialProps: { onCredential: first } }
		);

		const detach = attach(result.current);
		await act(async () => undefined);
		rerender({ onCredential: latest });
		render.mock.calls[0][2]();

		expect(render).toHaveBeenCalledWith(node, 'row', expect.any(Function));
		expect(latest).toHaveBeenCalledTimes(1);
		expect(first).not.toHaveBeenCalled();
		detach?.();
		expect(release).toHaveBeenCalledTimes(1);
	});

	it('releases a button that renders after the slot is gone', async () => {
		const release = jest.fn();
		let finish: (done: () => void) => void = () => undefined;
		render.mockReturnValue(new Promise(resolve => (finish = resolve)));
		const { result } = renderHook(() => useProviderButtons(jest.fn(), 'form'));

		const detach = attach(result.current);
		detach?.();
		await act(async () => finish(release));

		expect(release).toHaveBeenCalledTimes(1);
	});

	it('drops the slot when the Google button cannot render', async () => {
		jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
		render.mockRejectedValue(new Error('Could not load https://accounts.google.com/gsi/client'));
		const { result } = renderHook(() => useProviderButtons(jest.fn(), 'form'));

		attach(result.current);
		await act(async () => undefined);

		expect(result.current).toBeUndefined();
		expect(logger.warn).toHaveBeenCalled();
	});
});
