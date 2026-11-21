import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { ShareLinkButton } from '@/shared/theme/components/ShareLinkButton';
import { Text } from '@/shared/theme/components/Text';
import { TrackActionsButton } from '@/shared/theme/components/TrackActionsButton';
import { useMeasuredPress } from '@/shared/theme/hooks/useMeasuredPress';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { PanelTrackActions as PanelTrackActionsData } from '@/features/playback/features/now-playing-panel/nowPlayingPanelTypes';
import PlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/plus-solid.svg';

type PanelTrackActionsProps = {
	title: string;
	shareUrl: string;
	data: PanelTrackActionsData;
};

export function PanelTrackActions({ title, shareUrl, data }: PanelTrackActionsProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const addButton = useRef<View>(null);
	const pressAdd = useMeasuredPress(addButton, data.onAddToPlaylist);

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
			<TrackActionsButton onPress={data.onMoreActions} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		actions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
		pill: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.xs,
			paddingVertical: theme.spacing.xs,
			paddingHorizontal: theme.spacing.md,
			borderWidth: theme.borders.hairline,
			borderColor: theme.colors.border,
		},
		shareButton: { alignSelf: 'auto' },
		pillLabel: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
	});
	return styles;
}
