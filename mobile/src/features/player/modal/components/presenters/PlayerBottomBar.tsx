import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { HEADER_HIT_SLOP, type createStyles } from './playerModalStyles';

interface PlayerBottomBarProps {
	styles: ReturnType<typeof createStyles>;
	colors: {
		text: string;
		buttonBg: string;
	};
	deviceLabel: string | null;
	onOpenDevices: () => void;
	onOpenQueue: () => void;
}

export function PlayerBottomBar({
	styles,
	colors,
	deviceLabel,
	onOpenDevices,
	onOpenQueue,
}: PlayerBottomBarProps) {
	return (
		<View style={styles.bottomBar}>
			<View style={styles.deviceGroup}>
				<Pressable
					onPress={onOpenDevices}
					hitSlop={HEADER_HIT_SLOP}
					accessibilityRole="button"
					accessibilityLabel="Choisir l'appareil"
				>
					<View style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}>
						<Ionicons name="phone-portrait-outline" size={20} color={colors.text} />
					</View>
				</Pressable>
				{deviceLabel && (
					<Text
						style={[styles.deviceText, { color: colors.text }]}
						numberOfLines={1}
						accessibilityLabel={`Lecture sur ${deviceLabel}`}
					>
						Sur {deviceLabel}
					</Text>
				)}
			</View>

			<Pressable
				onPress={onOpenQueue}
				hitSlop={HEADER_HIT_SLOP}
				accessibilityRole="button"
				accessibilityLabel="File d'attente"
			>
				<View style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}>
					<Ionicons name="list" size={22} color={colors.text} />
				</View>
			</Pressable>
		</View>
	);
}
