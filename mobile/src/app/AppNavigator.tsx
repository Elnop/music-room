import React from 'react';
import { TrackActionsSheet } from '@/app/TrackActionsSheet';
import { QueueSheet } from '@/app/QueueSheet';
import { AppOverlays } from '@/app/AppOverlays';
import { AppTabs } from '@/app/AppTabs';
import { DevicePickerSheetContainer } from '@/features/playback/features/control-delegation/features/device-picker/components/DevicePickerSheetContainer';
import { PlayerProvider } from '@/features/playback/components/PlayerProvider';
import { useQueueSync } from '@/features/playback/hooks/useQueueSync';
import { useRemoteTarget } from '@/features/playback/hooks/useRemoteTarget';
import { MiniPlayerContainer } from '@/features/playback/features/mini-player/components/MiniPlayerContainer';
import { PlayerBarContainer } from '@/features/playback/features/player-bar/components/PlayerBarContainer';
import { NowPlayingPanelContainer } from '@/features/playback/features/now-playing-panel/components/NowPlayingPanelContainer';
import { useNowPlayingPanelStore } from '@/features/playback/shared/panel/nowPlayingPanelStore';
import { useEventsSync } from '@/features/events/useEventsSync';
import { AppFrameLayout } from '@/features/shell/components/orchestrators/AppFrameLayout';
import { PanelOpenContainer } from '@/features/shell/components/orchestrators/PanelOpenContainer';
import type { PlayerSheets } from '@/features/playback/shared/full-screen-sheet/FullScreenSheet';

export type { AppTabsParamList } from '@/app/AppTabs';
export type { FriendsStackParamList } from '@/app/stacks/FriendsStack';

const PLAYER_SHEETS: PlayerSheets = {
	QueueModal: QueueSheet,
	DevicePicker: DevicePickerSheetContainer,
};

export function AppNavigator() {
	const panelOpen = useNowPlayingPanelStore(state => state.isOpen);
	useQueueSync();
	useEventsSync();
	useRemoteTarget();

	return (
		<PlayerProvider>
			<AppFrameLayout
				panel={
					panelOpen && (
						<NowPlayingPanelContainer {...PLAYER_SHEETS} TrackActionsSheet={TrackActionsSheet} />
					)
				}
				playerBar={<PlayerBarContainer {...PLAYER_SHEETS} />}
				miniPlayer={<MiniPlayerContainer />}
				overlays={<AppOverlays sheets={PLAYER_SHEETS} />}
			>
				<PanelOpenContainer open={panelOpen}>
					<AppTabs />
				</PanelOpenContainer>
			</AppFrameLayout>
		</PlayerProvider>
	);
}
