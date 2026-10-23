import React from 'react';
import { RowSkeletonLayout } from './RowSkeletonLayout';

/** Same shape as a TrackItem row: 48px artwork, title and artist lines. */
export function TrackRowSkeleton() {
	return <RowSkeletonLayout radius={4} firstWidth="70%" secondWidth="45%" />;
}
