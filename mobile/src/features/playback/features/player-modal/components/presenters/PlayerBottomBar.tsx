import React from 'react';
import { View } from 'react-native';
import { KeyButton } from '@/shared/theme/components/KeyButton';
import { Text } from '@/shared/theme/components/Text';
import type { createStyles } from '@/features/playback/features/player-modal/components/presenters/playerModalStyles';
import PhoneRingingLowSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/phone-ringing-low-solid.svg';
import PlaylistSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/playlist-solid.svg';

type PlayerBottomBarProps = {
	styles: ReturnType<typeof createStyles>;
	deviceLabel: string | null;
	onOpenDevices: () => void;
	onOpenQueue: () => void;
};

export function PlayerBottomBar({
	styles,
	deviceLabel,
	onOpenDevices,
	onOpenQueue,
}: PlayerBottomBarProps) {
	return (
		<View style={styles.bottomBar}>
			<KeyButton
				icon={PhoneRingingLowSolid}
				onPress={onOpenDevices}
				accessibilityLabel="Choisir l'appareil"
				appearance={{ tone: 'device', size: 54, style: styles.deviceKey }}
			>
				<Text
					style={styles.deviceText}
					numberOfLines={1}
					accessibilityLabel={deviceLabel ? `Lecture sur ${deviceLabel}` : undefined}
				>
					{deviceLabel ? `Sur ${deviceLabel}` : 'Ce téléphone'}
				</Text>
			</KeyButton>
			<KeyButton
				icon={PlaylistSolid}
				onPress={onOpenQueue}
				accessibilityLabel="File d'attente"
				appearance={{ size: 54 }}
			/>
		</View>
	);
}
