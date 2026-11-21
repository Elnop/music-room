import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { PanelDeviceCard } from '@/features/playback/features/now-playing-panel/components/presenters/PanelDeviceCard';
import { PanelTrackDetails } from '@/features/playback/features/now-playing-panel/components/presenters/PanelTrackDetails';
import { UpNextSection } from '@/features/playback/features/now-playing-panel/components/presenters/UpNextSection';
import { PANEL_GUTTER } from '@/features/playback/features/now-playing-panel/nowPlayingPanelConfig';
import type { NowPlayingPanelData } from '@/features/playback/features/now-playing-panel/nowPlayingPanelTypes';

type PanelBodyProps = {
	data: NowPlayingPanelData;
};

export function PanelBody({ data }: PanelBodyProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
			<PanelTrackDetails data={data} />
			<PanelDeviceCard
				deviceLabel={data.deviceLabel}
				isRemote={data.isRemote}
				onOpenDevices={data.onOpenDevices}
			/>
			{data.track && (
				<UpNextSection
					items={data.upNext}
					total={data.upNextTotal}
					onPlay={data.onPlayItem}
					onOpenQueue={data.onOpenQueue}
				/>
			)}
		</ScrollView>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		scroll: { flex: 1 },
		content: {
			paddingHorizontal: PANEL_GUTTER,
			paddingBottom: theme.spacing.lg,
			gap: theme.spacing.lg,
		},
	});
	return styles;
}
