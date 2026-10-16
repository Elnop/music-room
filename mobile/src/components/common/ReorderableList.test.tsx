import React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { ReorderableList } from '@/components/common/ReorderableList';
import { hapticSelection } from '@/utils/haptics';

jest.mock('@/utils/haptics', () => ({ hapticSelection: jest.fn() }));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

type LibProps = {
	data: string[];
	renderItem: (info: { item: string; index: number }) => React.ReactElement;
	onReorder: (event: { from: number; to: number }) => void;
	onDragStart?: (event: { index: number }) => void;
	onDragEnd?: (event: { from: number; to: number }) => void;
};

// The library needs native drag; render its rows plainly and keep its props to fire drops.
let libProps: LibProps;
jest.mock('react-native-reorderable-list', () => {
	const { Fragment } = jest.requireActual('react');
	const { View } = jest.requireActual('react-native');
	return {
		__esModule: true,
		default: (props: LibProps) => {
			libProps = props;
			return (
				<View>
					{props.data.map((item, index) => (
						<Fragment key={item}>{props.renderItem({ item, index })}</Fragment>
					))}
				</View>
			);
		},
		reorderItems: <T,>(data: T[], from: number, to: number) => {
			const next = [...data];
			const [moved] = next.splice(from, 1);
			next.splice(to, 0, moved);
			return next;
		},
		useReorderableDrag: () => jest.fn(),
		useIsActive: () => false,
	};
});

const data = ['a', 'b', 'c'];
const rows = () => screen.getAllByTestId('row').map(row => row.props.children);

const renderList = (onReorder: (from: number, to: number) => Promise<unknown>) =>
	render(
		<ReorderableList
			data={data}
			keyExtractor={item => item}
			onReorder={onReorder}
			renderItem={({ item }) => (
				<Text key={item} testID="row">
					{item}
				</Text>
			)}
		/>
	);

describe('ReorderableList', () => {
	beforeEach(() => jest.clearAllMocks());

	it('ticks once at pick-up and once at drop, never while moving', () => {
		renderList(() => Promise.resolve());
		expect(hapticSelection).not.toHaveBeenCalled();
		act(() => libProps.onDragStart?.({ index: 0 }));
		expect(hapticSelection).toHaveBeenCalledTimes(1);
		act(() => libProps.onDragEnd?.({ from: 0, to: 2 }));
		expect(hapticSelection).toHaveBeenCalledTimes(2);
	});

	it('shows the dropped order while the move is in flight', () => {
		renderList(() => new Promise(() => {}));
		act(() => libProps.onReorder({ from: 0, to: 2 }));
		expect(rows()).toEqual(['b', 'c', 'a']);
	});

	it('does not call onReorder when the row is dropped in place', () => {
		const onReorder = jest.fn().mockResolvedValue(undefined);
		renderList(onReorder);
		act(() => libProps.onReorder({ from: 1, to: 1 }));
		expect(onReorder).not.toHaveBeenCalled();
	});

	it('shows data again when the move resolves without new data', async () => {
		renderList(() => Promise.resolve());
		await act(async () => libProps.onReorder({ from: 0, to: 2 }));
		expect(rows()).toEqual(['a', 'b', 'c']);
	});

	it('shows data again when the move fails', async () => {
		renderList(() => Promise.reject(new Error('network')));
		await act(async () => libProps.onReorder({ from: 0, to: 2 }));
		expect(rows()).toEqual(['a', 'b', 'c']);
	});

	it('shows new data from the store over the dropped order', () => {
		const { rerender } = renderList(() => new Promise(() => {}));
		act(() => libProps.onReorder({ from: 0, to: 2 }));
		rerender(
			<ReorderableList
				data={['c', 'a', 'b']}
				keyExtractor={item => item}
				onReorder={() => new Promise(() => {})}
				renderItem={({ item }) => (
					<Text key={item} testID="row">
						{item}
					</Text>
				)}
			/>
		);
		expect(rows()).toEqual(['c', 'a', 'b']);
	});
});
