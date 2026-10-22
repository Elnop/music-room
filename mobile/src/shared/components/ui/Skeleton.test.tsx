import React from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { SkeletonBlock, SkeletonList, TrackRowSkeleton } from './Skeleton';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

function mockReduceMotion(enabled: boolean) {
	jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(enabled);
}

afterEach(() => {
	jest.restoreAllMocks();
});

describe('SkeletonList', () => {
	it('renders the requested number of rows', async () => {
		mockReduceMotion(false);
		render(<SkeletonList count={4} row={TrackRowSkeleton} />);
		await act(async () => {});
		// A track row is one artwork block and two text lines.
		expect(screen.getAllByTestId('skeleton-block', { includeHiddenElements: true })).toHaveLength(
			12
		);
	});

	it('announces « Chargement » once for the whole list', async () => {
		mockReduceMotion(false);
		render(<SkeletonList count={3} row={TrackRowSkeleton} />);
		await act(async () => {});
		const announcements = screen.getAllByLabelText('Chargement');
		expect(announcements).toHaveLength(1);
		expect(announcements[0].props.accessibilityRole).toBe('progressbar');
		expect(announcements[0].props.accessibilityState).toEqual({ busy: true });
	});

	it('hides every block from screen readers', async () => {
		mockReduceMotion(false);
		render(<SkeletonList count={2} row={TrackRowSkeleton} />);
		await act(async () => {});
		expect(screen.queryAllByTestId('skeleton-block')).toHaveLength(0);
		for (const block of screen.getAllByTestId('skeleton-block', { includeHiddenElements: true })) {
			expect(block.props.accessibilityElementsHidden).toBe(true);
			expect(block.props.importantForAccessibility).toBe('no-hide-descendants');
		}
	});
});

describe('SkeletonBlock', () => {
	it('pulses when reduce motion is off', async () => {
		mockReduceMotion(false);
		const loop = jest.spyOn(Animated, 'loop');
		render(<SkeletonBlock />);
		await act(async () => {});
		expect(loop).toHaveBeenCalled();
	});

	it('stays static when reduce motion is on', async () => {
		mockReduceMotion(true);
		const loop = jest.spyOn(Animated, 'loop');
		render(<SkeletonBlock />);
		await act(async () => {});
		expect(loop).not.toHaveBeenCalled();
	});
});
