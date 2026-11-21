import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { rowColumns } from '@/shared/theme/lib/gridLayout';

export function useFriendColumns(friendsCount: number): number {
	const { breakpoint } = useBreakpoint();
	return Math.min(rowColumns(breakpoint), Math.max(2, friendsCount));
}
