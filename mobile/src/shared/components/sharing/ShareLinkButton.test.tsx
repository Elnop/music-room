import React from 'react';
import { Share } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ShareLinkButton } from './ShareLinkButton';
import { showError, showSuccess } from '@/shared/utils/toast';
import { logger } from '@/shared/utils/logger';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

const LINK = 'zumik://playlist/3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';

beforeEach(() => jest.restoreAllMocks());

describe('ShareLinkButton', () => {
	it('opens the share sheet with the link and the title', async () => {
		const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
		render(<ShareLinkButton url={LINK} title="Chill" />);

		fireEvent.press(screen.getByRole('button', { name: 'Partager' }));

		await waitFor(() =>
			expect(share).toHaveBeenCalledWith({ message: `Chill\n${LINK}`, title: 'Chill' })
		);
		expect(showSuccess).not.toHaveBeenCalled();
	});

	it('shares the link alone without a title', async () => {
		const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
		render(<ShareLinkButton url={LINK} />);

		fireEvent.press(screen.getByText('Partager'));

		await waitFor(() =>
			expect(share).toHaveBeenCalledWith(expect.objectContaining({ message: LINK }))
		);
	});

	it('says so when the share sheet fails', async () => {
		jest.spyOn(Share, 'share').mockRejectedValue(new Error('no activity'));
		jest.spyOn(logger, 'error').mockImplementation(() => {});
		render(<ShareLinkButton url={LINK} />);

		fireEvent.press(screen.getByText('Partager'));

		await waitFor(() => expect(showError).toHaveBeenCalledWith('Impossible de partager ce lien'));
	});
});
