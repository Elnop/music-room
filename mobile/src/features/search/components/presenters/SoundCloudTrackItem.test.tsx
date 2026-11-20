import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react-native';
import { SoundCloudTrackItem } from './SoundCloudTrackItem';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

const sampleTrack: SoundCloudTrack = {
	id: 1,
	title: 'Test Song',
	duration: 125000, // 2:05
	permalink_url: 'https://soundcloud.com/artist/song',
	artwork_url: 'https://example.com/art.jpg',
	description: null,
	genre: null,
	user: {
		id: 10,
		username: 'artist_name',
		avatar_url: null,
		permalink_url: 'https://soundcloud.com/artist',
	},
	playable: true,
};

describe('SoundCloudTrackItem', () => {
	const onPlay = jest.fn();
	const onAddToQueue = jest.fn();
	const onShowActions = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	const renderItem = async (track = sampleTrack) => {
		render(
			<SoundCloudTrackItem
				track={track}
				onPlay={onPlay}
				onAddToQueue={onAddToQueue}
				onShowActions={onShowActions}
			/>
		);
		await act(async () => {});
	};

	it('renders track title, username and formatted duration', async () => {
		await renderItem();

		expect(screen.getByText('Test Song')).toBeTruthy();
		expect(screen.getByText('artist_name')).toBeTruthy();
		expect(screen.getByText('2:05')).toBeTruthy();
	});

	it('calls onPlay on press', async () => {
		await renderItem();

		fireEvent.press(screen.getByLabelText('Écouter Test Song par artist_name'));
		expect(onPlay).toHaveBeenCalledWith(sampleTrack);
	});

	it('calls onShowActions on long press and on actions button', async () => {
		await renderItem();

		fireEvent(screen.getByLabelText('Écouter Test Song par artist_name'), 'longPress');
		expect(onShowActions).toHaveBeenCalledWith(sampleTrack);

		fireEvent.press(screen.getByLabelText('Actions'));
		expect(onShowActions).toHaveBeenCalledTimes(2);
	});

	it('shows preview badge when track is preview only', async () => {
		const previewTrack: SoundCloudTrack = {
			...sampleTrack,
			policy: 'SNIP',
		};

		await renderItem(previewTrack);

		expect(screen.getByText('Extrait')).toBeTruthy();
	});
});
