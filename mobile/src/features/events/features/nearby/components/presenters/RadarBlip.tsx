import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { GENRE_INFO } from '@/shared/theme/configs/genresConfig';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import { GENRE_COLORS } from '@/shared/theme/configs/tokensConfig';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { radarSpot } from '@/features/events/features/nearby/lib/radarSpot';
import { RADAR_BLIP } from '@/features/events/features/nearby/configs/radarConfig';
import { RadarBlipLabel } from '@/features/events/features/nearby/components/presenters/RadarBlipLabel';
import type { NearbyItem } from '@/features/events/features/nearby/nearbyTypes';

type RadarBlipProps = {
	item: NearbyItem;
	rank: number;
	total: number;
	onOpen: (id: string) => void;
};

function spotStyle(left: number, top: number): ViewStyle {
	return { left: `${left}%`, top: `${top}%` };
}

function backgroundStyle(color: string): ViewStyle {
	return { backgroundColor: color };
}

export function RadarBlip({ item: { event, proximity }, rank, total, onOpen }: RadarBlipProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const spot = radarSpot(event.id, rank, total);

	return (
		<Pressable
			style={[
				styles.blip,
				spotStyle(spot.left, spot.top),
				spot.left > RADAR_BLIP.labelFlipLeft && styles.blipFlipped,
			]}
			onPress={() => onOpen(event.id)}
			accessibilityLabel={`${event.name}, ${proximity}`}
		>
			<View style={[styles.dot, backgroundStyle(GENRE_COLORS[event.genres[0]])]}>
				<PixelIcon icon={GENRE_INFO[event.genres[0]].icon} size={12} color={theme.colors.onColor} />
			</View>
			{rank === 0 && <RadarBlipLabel name={event.name} proximity={proximity} />}
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		blip: {
			position: 'absolute',
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.sm,
			marginLeft: RADAR_BLIP.offset,
			marginTop: RADAR_BLIP.offset,
		},
		blipFlipped: { flexDirection: 'row-reverse', transform: [{ translateX: '-100%' }] },
		dot: {
			...pixelFrame(theme),
			width: RADAR_BLIP.dot,
			height: RADAR_BLIP.dot,
			alignItems: 'center',
			justifyContent: 'center',
		},
	});
	return styles;
}
