import React, { useRef } from 'react';
import { View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { useTheme } from '@/shared/theme/ThemeContext';
import { useAnchoredPress } from '@/shared/hooks/useAnchoredPress';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Text } from '@/shared/components/ui/Text';
import { ShareLinkButton } from '@/shared/components/sharing/ShareLinkButton';
import { TrackActionsButton } from '@/shared/components/lists/TrackActionsButton';
import type { NowPlayingPanelStyles } from './nowPlayingPanelStyles';

interface PanelTrackActionsProps {
	title: string;
	shareUrl: string;
	styles: NowPlayingPanelStyles;
	onAddToPlaylist: () => void;
	onMoreActions: () => void;
}

/** The track's actions; both menus drop down from their button, as on the track lists. */
export function PanelTrackActions({
	title,
	shareUrl,
	styles,
	onAddToPlaylist,
	onMoreActions,
}: PanelTrackActionsProps) {
	const { theme } = useTheme();
	const addButton = useRef<View>(null);
	const pressAdd = useAnchoredPress(addButton, onAddToPlaylist);

	return (
		<View style={styles.actions}>
			<View ref={addButton} collapsable={false}>
				<Pressable
					style={styles.pill}
					onPress={pressAdd}
					accessibilityLabel="Ajouter à une playlist"
				>
					<PixelIcon name="plus" size={16} color={theme.colors.text} />
					<Text style={styles.pillLabel}>Ajouter</Text>
				</Pressable>
			</View>
			<ShareLinkButton url={shareUrl} title={title} style={styles.shareButton} />
			<TrackActionsButton onPress={onMoreActions} />
		</View>
	);
}
