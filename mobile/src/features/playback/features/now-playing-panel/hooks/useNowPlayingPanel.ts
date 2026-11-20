import { useCallback, useMemo, useState } from 'react';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { hexToRgba, useImageColors } from '@/shared/image-colors/useImageColors';
import { useNowPlayingPanelStore } from '@/features/playback/shared/panel/nowPlayingPanelStore';
import type { TrackActionsStart } from '@/shared/playback/lib/trackActionsBridge';
import { THIS_DEVICE_LABEL } from '@/shared/platform/platform';
import { largeArtwork } from '@/features/playback/shared/artwork/artwork';
import { toTrackInput } from '@/shared/tracks/lib/trackInput';
import type { AddQueueItemBody } from '@/shared/playback/lib/playback';
import { useNowPlaying } from '@/features/playback/shared/player/hooks/useNowPlaying';
import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import { UP_NEXT_COUNT } from '@/features/playback/shared/player/lib/constants';
import { upNext } from '@/features/playback/features/now-playing-panel/upNext';
import { usePanelFocus } from './usePanelFocus';
import { recordMenuAnchor } from '@/shared/theme/menuAnchorStore';
import type { MenuAnchor } from '@/shared/theme/lib/menuPlacement';
import { useActiveQueue, useQueueStore } from '@/features/playback/shared/player/stores/queueStore';

type Sheet = 'queue' | 'devices';

interface OpenActions {
	track: AddQueueItemBody;
	start: TrackActionsStart;
}

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
			void useQueueStore.getState().playItem(itemId);
		},
		isQueueOpen: sheet === 'queue',
		isDevicesOpen: sheet === 'devices',
		onOpenQueue: () => setSheet('queue'),
		onOpenDevices: () => setSheet('devices'),
		onCloseSheet: () => setSheet(null),
		actions,
		onAddToPlaylist: (anchor?: MenuAnchor) => {
			recordMenuAnchor(anchor);
			openActions('playlists');
		},
		onMoreActions: (anchor?: MenuAnchor) => {
			recordMenuAnchor(anchor);
			openActions('actions');
		},
		onCloseActions: () => setActions(null),
	};
}

export type NowPlayingPanelData = ReturnType<typeof useNowPlayingPanel>;
