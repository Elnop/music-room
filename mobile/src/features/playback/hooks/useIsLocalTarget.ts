import { useConnectState } from '@/features/playback/shared/player/hooks/useConnectState';

export function useIsLocalTarget(): boolean {
	return useConnectState(state => state.target.kind === 'local');
}
