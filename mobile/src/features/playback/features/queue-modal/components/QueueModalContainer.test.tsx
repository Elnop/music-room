import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createStore } from 'zustand';
import { QueueModalContainer } from '@/features/playback/features/queue-modal/components/QueueModalContainer';
import { useQueueStore } from '@/features/playback/shared/player/stores/queueStore';
import { useConnectStore } from '@/features/playback/shared/player/stores/connectStore';
import { registerAuthSession } from '@/shared/backend/lib/authSession';
import type { SessionView } from '@/shared/backend/lib/authSession';
import type { UserProfile } from '@/shared/users/user.types';
import type { QueueItem, QueueState } from '@/features/playback/shared/player/lib/queue.types';

jest.mock('@/shared/theme/components/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/lib/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('react-native-gesture-handler', () => ({
	...jest.requireActual('react-native-gesture-handler'),
	GestureHandlerRootView: jest.requireActual('react-native').View,
}));

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/backend/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/features/playback/shared/player/lib/queueApi', () => ({
	queueApi: {
		getQueue: jest.fn(),
		next: jest.fn(),
		previous: jest.fn(),
		playItem: jest.fn(),
		moveItem: jest.fn(),
		removeItem: jest.fn(),
	},
}));

type LibProps = {
	data: QueueItem[];
	keyExtractor: (item: QueueItem) => string;
	renderItem: (info: { item: QueueItem; index: number }) => React.ReactElement;
	ListHeaderComponent?: React.ReactElement | null;
	ListEmptyComponent?: React.ReactElement | null;
};

jest.mock('react-native-reorderable-list', () => {
	const { Fragment } = jest.requireActual('react');
	const { View } = jest.requireActual('react-native');
	return {
		__esModule: true,
		default: (props: LibProps) => (
			<View>
				{props.ListHeaderComponent}
				{props.data.length === 0
					? props.ListEmptyComponent
					: props.data.map((item, index) => (
							<Fragment key={props.keyExtractor(item)}>
								{props.renderItem({ item, index })}
							</Fragment>
						))}
			</View>
		),
		reorderItems: <T,>(data: T[]) => data,
		useReorderableDrag: () => jest.fn(),
		useIsActive: () => false,
	};
});

function item(id: string): QueueItem {
	return {
		id,
		rank: id,
		track: {
			trackUri: `https://soundcloud.com/artist/${id}`,
			title: `Title ${id}`,
			artist: 'Artist',
			album: null,
			albumArt: null,
			durationMs: 61000,
		},
		sourcePlaylistId: null,
		blockId: null,
		blockDetached: false,
	};
}

let nextVersion = 0;
function setQueue(state: Pick<QueueState, 'currentItemId' | 'items'>, ownerId = 'owner') {
	return useQueueStore.getState().applyState({ ownerId, version: ++nextVersion, ...state });
}

function titles() {
	return screen.queryAllByText(/^Title /u).map(node => node.props.children);
}

async function renderModal() {
	render(<QueueModalContainer visible onClose={jest.fn()} TrackActionsSheet={() => null} />);
	await act(async () => {});
}

const initialQueue = useQueueStore.getState();

const testSessionStore = createStore<SessionView>(() => ({
	user: { id: 'owner' } as UserProfile,
	accessToken: 'test-token',
	isAuthenticated: true,
}));

registerAuthSession({
	store: testSessionStore,
	isTokenExpiringSoon: () => false,
	refreshAccessToken: async () => true,
});

beforeEach(() => {
	useQueueStore.setState(initialQueue, true);
	testSessionStore.setState({ user: { id: 'owner' } as UserProfile });
	useConnectStore.setState({ target: { kind: 'local' }, remoteStatus: null });
});

describe('QueueModalContainer', () => {
	it('lists the current item first, then the upcoming ones, without history', async () => {
		setQueue({ currentItemId: 'b', items: ['a', 'b', 'c', 'd'].map(item) });
		await renderModal();

		expect(titles()).toStrictEqual(['Title b', 'Title c', 'Title d']);
		expect(screen.getByLabelText('Lire Title b').props.accessibilityState).toMatchObject({
			selected: true,
		});
		expect(screen.getAllByText('1:01')).toHaveLength(3);
	});

	it('only the upcoming items have a drag handle', async () => {
		setQueue({ currentItemId: 'a', items: ['a', 'b', 'c'].map(item) });
		await renderModal();

		expect(screen.getAllByLabelText('Réordonner')).toHaveLength(2);
	});

	it('lists every item as upcoming when nothing is current', async () => {
		setQueue({ currentItemId: null, items: ['a', 'b'].map(item) });
		await renderModal();

		expect(titles()).toStrictEqual(['Title a', 'Title b']);
		expect(screen.queryByText('En cours de lecture')).toBeNull();
	});

	it('shows the empty state for an empty queue', async () => {
		setQueue({ currentItemId: null, items: [] });
		await renderModal();

		expect(screen.getByText("La file d'attente est vide")).toBeTruthy();
	});

	it('says nothing is next when only the current item is left', async () => {
		setQueue({ currentItemId: 'a', items: ['a'].map(item) });
		await renderModal();

		expect(titles()).toStrictEqual(['Title a']);
		expect(screen.getByText('Rien à suivre')).toBeTruthy();
	});

	it('plays a tapped item', async () => {
		const playItem = jest.fn().mockResolvedValue('played');
		useQueueStore.setState({ playItem });
		setQueue({ currentItemId: 'a', items: ['a', 'b'].map(item) });
		await renderModal();

		fireEvent.press(screen.getByLabelText('Lire Title b'));
		expect(playItem).toHaveBeenCalledWith('b');
	});

	it('re-renders when the store changes, as on queue:updated', async () => {
		setQueue({ currentItemId: 'a', items: ['a', 'b'].map(item) });
		await renderModal();

		act(() => setQueue({ currentItemId: 'a', items: ['a', 'c', 'b'].map(item) }));
		expect(titles()).toStrictEqual(['Title a', 'Title c', 'Title b']);
	});

	it("shows the friend's queue in remote mode on their device, mine again after", async () => {
		setQueue({ currentItemId: 'a', items: ['a', 'b'].map(item) });
		useConnectStore.setState({ target: { kind: 'remote', ownerId: 'friend', deviceId: 'tablet' } });
		setQueue({ currentItemId: 'c', items: ['c', 'd'].map(item) }, 'friend');
		await renderModal();
		expect(titles()).toStrictEqual(['Title c', 'Title d']);

		act(() => useConnectStore.setState({ target: { kind: 'local' } }));
		expect(titles()).toStrictEqual(['Title a', 'Title b']);
	});
});
