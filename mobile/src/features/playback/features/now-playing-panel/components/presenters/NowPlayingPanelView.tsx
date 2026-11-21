import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { useSeparatorColor } from '@/shared/theme/hooks/useSeparatorColor';
import { NOW_PLAYING_PANEL_WIDTH } from '@/shared/theme/configs/layoutConfig';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { PANEL_ID } from '@/features/playback/shared/player/configs/playerConfig';
import { NowPlayingPanelSheets } from '@/features/playback/features/now-playing-panel/components/presenters/NowPlayingPanelSheets';
import { PanelBody } from '@/features/playback/features/now-playing-panel/components/presenters/PanelBody';
import { PanelHeader } from '@/features/playback/features/now-playing-panel/components/presenters/PanelHeader';
import { PANEL_GRADIENT_HEIGHT } from '@/features/playback/features/now-playing-panel/nowPlayingPanelConfig';
import type {
	NowPlayingPanelData,
	PanelSheetComponents,
} from '@/features/playback/features/now-playing-panel/nowPlayingPanelTypes';

type NowPlayingPanelViewProps = PanelSheetComponents & {
	data: NowPlayingPanelData;
};

function separatorStyle(separator: string): ViewStyle {
	return { borderLeftColor: separator };
}

export function NowPlayingPanelView({ data, ...sheets }: NowPlayingPanelViewProps) {
	const separator = useSeparatorColor();
	const { styles } = useThemedStyles(createStyles);

	return (
		<View
			style={[styles.panel, separatorStyle(separator)]}
			nativeID={PANEL_ID}
			accessibilityLabel="En cours de lecture"
		>
			<LinearGradient colors={data.gradient} style={styles.gradient} pointerEvents="none" />
			<PanelHeader onClose={data.onClose} />
			<PanelBody data={data} />
			<NowPlayingPanelSheets data={data} sheets={sheets} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		panel: {
			width: NOW_PLAYING_PANEL_WIDTH,
			borderLeftWidth: theme.borders.hairline,
			backgroundColor: theme.colors.background,
			overflow: 'hidden',
		},
		gradient: { position: 'absolute', top: 0, left: 0, right: 0, height: PANEL_GRADIENT_HEIGHT },
	});
	return styles;
}
