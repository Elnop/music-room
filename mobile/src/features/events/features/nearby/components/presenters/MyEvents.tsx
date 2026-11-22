import React from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyButton } from '@/shared/theme/components/KeyButton';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { EventRow } from '@/features/events/features/nearby/components/presenters/EventRow';
import type { MusicEvent } from '@/features/events/eventTypes';
import PlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/plus-solid.svg';

type MyEventsProps = {
	events: MusicEvent[];
	onOpen: (id: string) => void;
	onCreate: () => void;
};

export function MyEvents({ events, onOpen, onCreate }: MyEventsProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={styles.mine}>
			<View style={styles.list}>
				{events.map((event) => (
					<EventRow key={event.id} event={event} onPress={() => onOpen(event.id)} />
				))}
			</View>
			<KeyButton
				icon={PlusSolid}
				onPress={onCreate}
				accessibilityLabel="Créer un événement"
				appearance={{ tone: 'primary', size: theme.controls.keyRow }}
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		mine: {
			flexDirection: 'row',
			alignItems: 'flex-start',
			gap: theme.spacing.md,
			marginTop: theme.spacing.md,
			marginHorizontal: theme.spacing.md,
		},
		list: { flex: 1, gap: theme.spacing.md },
	});
	return styles;
}
