import { useCallback, useMemo, useState } from 'react';
import { useTheme } from '@/shared/theme/ThemeContext';
import { hexToRgba, useImageColors } from '@/shared/hooks/useImageColors';
import { useNowPlayingPanelStore } from '@/shared/stores/nowPlayingPanelStore';
import { getPlayback, useActiveQueue } from '@/shared/services/playbackBridge';
import type { TrackActionsStart } from '@/shared/services/trackActionsBridge';
import { THIS_DEVICE_LABEL } from '@/shared/constants/platform';
import { largeArtwork } from '@/shared/utils/artwork';
import { toTrackInput } from '@/shared/utils/trackInput';
import type { AddQueueItemBody } from '@/shared/types/playback';
import { useNowPlaying } from '@/features/player/hooks/useNowPlaying';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { UP_NEXT_COUNT } from '@/features/player/constants';
import { upNext } from '@/features/player/nowPlayingPanel/utils/upNext';
import { usePanelFocus } from './usePanelFocus';

type Sheet = 'queue' | 'devices';

interface OpenActions {
	track: AddQueueItemBody;
	start: TrackActionsStart;
}

/** What the desktop's panel shows; the transport stays in the player bar under it. */
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
	// The queue item names the track on any device; a track played outside the queue is the local one's.
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

	const openActions = (start: TrackActionsStart) => {
		// A new body each time: the sheet keeps its step for the track it already shows.
		if (source) setActions({ track: toTrackInput(source), start });
	};

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
			void getPlayback().playItem?.(itemId);
		},
		isQueueOpen: sheet === 'queue',
		isDevicesOpen: sheet === 'devices',
		onOpenQueue: () => setSheet('queue'),
		onOpenDevices: () => setSheet('devices'),
		onCloseSheet: () => setSheet(null),
		actions,
		onAddToPlaylist: () => openActions('playlists'),
		onMoreActions: () => openActions('actions'),
		onCloseActions: () => setActions(null),
	};
}

export type NowPlayingPanelData = ReturnType<typeof useNowPlayingPanel>;
