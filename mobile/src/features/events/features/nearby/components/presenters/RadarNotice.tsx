import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/shared/theme/components/Button';
import { Text } from '@/shared/theme/components/Text';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { NearbyEvents } from '@/features/events/features/nearby/nearbyTypes';

type RadarNoticeProps = {
	nearby: NearbyEvents;
};

const NOTICE_ACTIONS = {
	request: { label: 'Autoriser la localisation', handler: 'requestPermission' },
	settings: { label: 'Ouvrir les réglages', handler: 'openSettings' },
	retry: { label: 'Réessayer', handler: 'requestPermission' },
} as const;

export function RadarNotice({ nearby }: RadarNoticeProps) {
	const { styles } = useThemedStyles(createStyles);
	const action = nearby.notice.action && NOTICE_ACTIONS[nearby.notice.action];

	return (
		<View style={styles.notice}>
			<Text style={styles.text}>{nearby.notice.message}</Text>
			{action && (
				<Button
					title={action.label}
					size="compact"
					variant="outline"
					onPress={nearby[action.handler]}
				/>
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		notice: {
			position: 'absolute',
			top: theme.spacing.lg,
			left: theme.spacing.lg,
			right: theme.spacing.lg,
			alignItems: 'center',
			gap: theme.spacing.sm,
		},
		text: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.text,
			textAlign: 'center',
		},
	});
	return styles;
}
