import React from 'react';
import { SkeletonRow } from '@/shared/theme/components/SkeletonRow';

export function UserRowSkeleton() {
	return <SkeletonRow radius={24} firstWidth="55%" secondWidth="35%" />;
}
