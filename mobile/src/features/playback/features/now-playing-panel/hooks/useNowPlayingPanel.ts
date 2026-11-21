import { useCallback, useMemo, useState } from 'react';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { hexToRgba, useImageColors } from '@/shared/image-colors/useImageColors';
import { useNowPlayingPanelStore } from '@/features/playback/shared/panel/nowPlayingPanelStore';
import type { TrackActionsStart } from '@/shared/playback/types/trackActionsSheetTypes';
import { THIS_DEVICE_LABEL } from '@/shared/platform/platformConfig';
import { largeArtwork } from '@/features/playback/shared/artwork/artwork';
import { toTrackInput } from '@/shared/tracks/lib/toTrackInput';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import { useNowPlaying } from '@/features/playback/shared/player/hooks/useNowPlaying';
import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import { UP_NEXT_COUNT } from '@/features/playback/shared/player/lib/constants';
import { upNext } from '@/features/playback/features/now-playing-panel/upNext';
import { usePanelFocus } from '@/features/playback/features/now-playing-panel/hooks/usePanelFocus';
import { menuAnchorActions } from '@/shared/theme/menuAnchorStore';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';
import { useActiveQueue, useQueueStore } from '@/features/playback/shared/player/stores/queueStore';

type Sheet = 'queue' | 'devices';

type OpenActions = {
	track: AddQueueItemBody;
	start: TrackActionsStart;
};

export function useNowPlayingPanel() {
	const { theme } = useTheme();
	const setOpen = useNowPlayingPanelStore(state => state.setOpen);
	const nowPlaying = useNowPlaying();
	const queue = useActiveQueue();
	const localTrack = usePlayerStore(state => state.currentTrack);
	const [sheet, setSheet] = useState<Sheet | null>(null);
	const [actions, setActions] = useState<OpenActions | null>(null);

	const close = useCallback(() => setOpen(false), [setOpen]);
	usePanelFocus(close);

	const next = useMemo(() => upNext(queue, UP_NEXT_COUNT), [queue]);
	const source = next.current?.track ?? (nowPlaying.isRemote ? null : localTrack);
	const artworkUrl = largeArtwork(nowPlaying.track?.artworkUrl);
	const { dominantColor } = useImageColors(artworkUrl, theme.colors.primary);

	const gradient = useMemo<readonly [string, string]>(
		() =>
			dominantColor
				? [hexToRgba(dominantColor, 0.22), 'transparent']
				: ['transparent', 'transparent'],
		[dominantColor]
	);

	function openActions(start: TrackActionsStart) {
		if (source) setActions({ track: toTrackInput(source), start });
	}

	return {
		track: nowPlaying.track,
		artworkUrl,
		gradient,
		shareUrl: source ? toTrackInput(source).trackUri : null,
		deviceLabel: nowPlaying.deviceLabel ?? THIS_DEVICE_LABEL,
		isRemote: nowPlaying.isRemote,
		upNext: next.items,
		upNextTotal: next.total,
		onClose: close,
		onPlayItem: (itemId: string) => {
			void useQueueStore.getState().playItem(itemId);
		},
		isQueueOpen: sheet === 'queue',
		isDevicesOpen: sheet === 'devices',
		onOpenQueue: () => setSheet('queue'),
		onOpenDevices: () => setSheet('devices'),
		onCloseSheet: () => setSheet(null),
		actions,
		onAddToPlaylist: (anchor?: MenuAnchor) => {
			menuAnchorActions.record(anchor);
			openActions('playlists');
		},
		onMoreActions: (anchor?: MenuAnchor) => {
			menuAnchorActions.record(anchor);
			openActions('actions');
		},
		onCloseActions: () => setActions(null),
	};
}

export type NowPlayingPanelData = ReturnType<typeof useNowPlayingPanel>;
