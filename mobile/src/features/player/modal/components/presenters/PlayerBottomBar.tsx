import React from 'react';
import { View } from 'react-native';
import { KeyButton } from '@/shared/components/ui/KeyButton';
import { Text } from '@/shared/components/ui/Text';
import type { createStyles } from './playerModalStyles';

interface PlayerBottomBarProps {
	styles: ReturnType<typeof createStyles>;
	deviceLabel: string | null;
	onOpenDevices: () => void;
	onOpenQueue: () => void;
}

/** Where the sound plays, and the queue: the two keys under the controls. */
export function PlayerBottomBar({ styles, deviceLabel, onOpenDevices, onOpenQueue }: PlayerBottomBarProps) {
	return (
		<View style={styles.bottomBar}>
			<KeyButton
				icon="phone"
				tone="device"
				size={54}
				onPress={onOpenDevices}
				accessibilityLabel="Choisir l'appareil"
				style={styles.deviceKey}
			>
				<Text
					style={styles.deviceText}
					numberOfLines={1}
					accessibilityLabel={deviceLabel ? `Lecture sur ${deviceLabel}` : undefined}
				>
					{deviceLabel ? `Sur ${deviceLabel}` : 'Ce téléphone'}
				</Text>
			</KeyButton>
			<KeyButton icon="queue" size={54} onPress={onOpenQueue} accessibilityLabel="File d'attente" />
		</View>
	);
}
