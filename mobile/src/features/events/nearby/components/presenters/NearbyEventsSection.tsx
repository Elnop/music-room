import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { RadarScope } from '@/shared/components/media/RadarScope';
import { Button } from '@/shared/components/ui/Button';
import { KeyButton } from '@/shared/components/ui/KeyButton';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Text } from '@/shared/components/ui/Text';
import { pixelFrame } from '@/shared/theme/pixelFrame';
import { GENRE_COLORS } from '@/shared/theme/tokens';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { NearbyEvents } from '@/features/events/nearby/hooks/useNearbyEvents';
import { radarSpot } from '@/features/events/nearby/utils/radarBlips';
import { BeaconStatusLine } from './BeaconStatusLine';
import { EventRow } from './EventRow';

const NOTICE_ACTIONS = {
	request: { label: 'Autoriser la localisation', handler: 'requestPermission' },
	settings: { label: 'Ouvrir les réglages', handler: 'openSettings' },
	retry: { label: 'Réessayer', handler: 'requestPermission' },
} as const;

/** Past this point the nearest event's label opens to the left, to stay on the radar. */
const LABEL_FLIP_LEFT = 55;

export function NearbyEventsSection({ nearby }: { nearby: NearbyEvents }) {
	const { styles, theme } = useThemedStyles(createStyles);
	const action = nearby.notice.action && NOTICE_ACTIONS[nearby.notice.action];

	return (
		<View accessibilityLabel="Événements à proximité">
			<RadarScope>
				{nearby.items.map(({ event, proximity }, rank) => {
					const spot = radarSpot(event.id, rank, nearby.items.length);
					return (
						<Pressable
							key={event.id}
							style={[
								styles.blip,
								{ left: `${spot.left}%`, top: `${spot.top}%` },
								spot.left > LABEL_FLIP_LEFT && styles.blipFlipped,
							]}
							onPress={() => nearby.openEvent(event.id)}
							accessibilityLabel={`${event.name}, ${proximity}`}
						>
							<View style={[styles.dot, { backgroundColor: GENRE_COLORS[event.genres[0]] }]}>
								<PixelIcon name={event.genres[0]} size={12} color={theme.colors.onColor} />
							</View>
							{rank === 0 && (
								<View style={styles.label}>
									<Text style={styles.labelName} numberOfLines={1}>
										{event.name}
									</Text>
									<Text style={styles.labelDistance}>{proximity}</Text>
								</View>
							)}
						</Pressable>
					);
				})}
				{nearby.items.length === 0 && (
					<View style={styles.notice}>
						<Text style={styles.noticeText}>{nearby.notice.message}</Text>
						{action && (
							<Button
								title={action.label}
								size="compact"
								variant="outline"
								onPress={nearby[action.handler]}
							/>
						)}
					</View>
				)}
				<View style={styles.count}>
					<PixelIcon name="beacon" size={12} color={theme.colors.primary} />
					<Text style={styles.countText}>{nearby.items.length}</Text>
				</View>
			</RadarScope>

			<View style={styles.mine}>
				<View style={styles.mineList}>
					{nearby.mine.map(event => (
						<EventRow key={event.id} event={event} onPress={() => nearby.openEvent(event.id)} />
					))}
				</View>
				<KeyButton
					icon="plus"
					tone="primary"
					size={45}
					onPress={nearby.createEvent}
					accessibilityLabel="Créer un événement"
				/>
			</View>
			<BeaconStatusLine
				status={nearby.beaconStatus}
				onRequestPermission={nearby.requestBeaconPermission}
			/>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		blip: {
			position: 'absolute',
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.sm,
			marginLeft: -10,
			marginTop: -10,
		},
		blipFlipped: { flexDirection: 'row-reverse', transform: [{ translateX: '-100%' }] },
		dot: {
			...pixelFrame(theme),
			width: 21,
			height: 21,
			alignItems: 'center',
			justifyContent: 'center',
		},
		label: {
			...pixelFrame(theme),
			maxWidth: 170,
			backgroundColor: theme.colors.text,
			paddingVertical: theme.spacing.xs,
			paddingHorizontal: theme.spacing.sm,
		},
		labelName: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.textInverse,
		},
		labelDistance: {
			fontSize: theme.typography.sizes.xs,
			fontFamily: theme.typography.families.mono,
			color: theme.colors.textInverse,
		},
		notice: {
			position: 'absolute',
			top: theme.spacing.lg,
			left: theme.spacing.lg,
			right: theme.spacing.lg,
			alignItems: 'center',
			gap: theme.spacing.sm,
		},
		noticeText: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.text,
			textAlign: 'center',
		},
		count: {
			position: 'absolute',
			left: theme.spacing.sm,
			bottom: theme.spacing.sm,
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.xs,
		},
		countText: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.mono,
			color: theme.colors.primary,
		},
		mine: {
			flexDirection: 'row',
			alignItems: 'flex-start',
			gap: theme.spacing.md,
			marginTop: theme.spacing.md,
			marginHorizontal: theme.spacing.md,
		},
		mineList: { flex: 1, gap: theme.spacing.md },
	});
