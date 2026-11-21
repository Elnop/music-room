import React, { useRef } from 'react';
import { View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { useMeasuredPress } from '@/shared/theme/hooks/useMeasuredPress';
import type { MenuAnchor } from '@/shared/theme/lib/menuPlacement';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { ShareLinkButton } from '@/shared/theme/components/ShareLinkButton';
import { TrackActionsButton } from '@/shared/theme/components/TrackActionsButton';
import type { NowPlayingPanelStyles } from '@/features/playback/features/now-playing-panel/components/presenters/nowPlayingPanelStyles';
import PlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/plus-solid.svg';

type PanelTrackActionsProps = {
	title: string;
	shareUrl: string;
	styles: NowPlayingPanelStyles;
	onAddToPlaylist: (anchor?: MenuAnchor) => void;
	onMoreActions: (anchor?: MenuAnchor) => void;
};

export function PanelTrackActions({
	title,
	shareUrl,
	styles,
	onAddToPlaylist,
	onMoreActions,
}: PanelTrackActionsProps) {
	const { theme } = useTheme();
	const addButton = useRef<View>(null);
	const pressAdd = useMeasuredPress(addButton, onAddToPlaylist);

	return (
		<View style={styles.actions}>
			<View ref={addButton} collapsable={false}>
				<Pressable
					style={styles.pill}
					onPress={pressAdd}
					accessibilityLabel="Ajouter à une playlist"
				>
					<PixelIcon icon={PlusSolid} size={16} color={theme.colors.text} />
					<Text style={styles.pillLabel}>Ajouter</Text>
				</Pressable>
			</View>
			<ShareLinkButton url={shareUrl} title={title} style={styles.shareButton} />
			<TrackActionsButton onPress={onMoreActions} />
		</View>
	);
}
