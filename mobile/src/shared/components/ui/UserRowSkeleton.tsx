import React from 'react';
import { RowSkeletonLayout } from './RowSkeletonLayout';

/** Same shape as a user row: round avatar, name and subtitle lines. */
export function UserRowSkeleton() {
	return <RowSkeletonLayout radius={24} firstWidth="55%" secondWidth="35%" />;
}
