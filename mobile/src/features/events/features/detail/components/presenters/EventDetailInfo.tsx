import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { formatEventDate } from '@/features/events/shared/event-dates/eventDates';
import { InfoRow } from '@/features/events/features/detail/components/presenters/InfoRow';
import type { MusicEvent } from '@/features/events/eventTypes';
import ClockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/clock-solid.svg';
import LoginSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/login-solid.svg';
import WifiSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/wifi-solid.svg';

type EventDetailInfoProps = {
	event: MusicEvent;
};

export function EventDetailInfo({ event }: EventDetailInfoProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<>
			<InfoRow
				icon={ClockSolid}
				label="Quand"
				text={`${formatEventDate(event.startsAt)} → ${formatEventDate(event.endsAt)}`}
			/>
			<InfoRow icon={WifiSolid} label="Où" text={event.address} />
			{event.accessInfo && (
				<InfoRow icon={LoginSolid} label="Comment y accéder" text={event.accessInfo} />
			)}
			{event.description && <Text style={styles.description}>{event.description}</Text>}
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		description: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.text,
			lineHeight: theme.typography.lineHeights.sm,
		},
	});
	return styles;
}
