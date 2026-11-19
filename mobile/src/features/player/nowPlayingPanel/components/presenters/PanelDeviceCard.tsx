import React from 'react';
import { View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { useTheme } from '@/shared/theme/ThemeContext';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Text } from '@/shared/components/ui/Text';
import type { NowPlayingPanelStyles } from './nowPlayingPanelStyles';
import LaptopSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/laptop-solid.svg';
import PhoneRingingLowSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/phone-ringing-low-solid.svg';

interface PanelDeviceCardProps {
	deviceLabel: string;
	isRemote: boolean;
	styles: NowPlayingPanelStyles;
	onOpenDevices: () => void;
}

export function PanelDeviceCard({
	deviceLabel,
	isRemote,
	styles,
	onOpenDevices,
}: PanelDeviceCardProps) {
	const { theme } = useTheme();
	return (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<Text style={styles.cardTitle} accessibilityRole="header">
					Appareil
				</Text>
				<Pressable onPress={onOpenDevices} accessibilityLabel="Choisir l'appareil">
					<Text style={styles.link}>Changer</Text>
				</Pressable>
			</View>
			<View style={styles.device}>
				<View style={styles.deviceIcon}>
					<PixelIcon
						icon={isRemote ? PhoneRingingLowSolid : LaptopSolid}
						size={20}
						color={isRemote ? theme.colors.primary : theme.colors.text}
					/>
				</View>
				<View style={styles.deviceText}>
					<Text style={styles.caption}>Lecture sur</Text>
					<Text style={[styles.deviceName, isRemote && styles.remoteName]} numberOfLines={1}>
						{deviceLabel}
					</Text>
				</View>
			</View>
		</View>
	);
}
