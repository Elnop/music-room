import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { HEADER_HIT_SLOP, type createStyles } from './playerModalStyles';

interface PlayerHeaderProps {
	styles: ReturnType<typeof createStyles>;
	colors: {
		text: string;
		textSecondary: string;
		buttonBg: string;
	};
	deviceLabel: string | null;
	onClose: () => void;
	onOpenDevices: () => void;
	onOpenQueue: () => void;
}

export function PlayerHeader({
	styles,
	colors,
	deviceLabel,
	onClose,
	onOpenDevices,
	onOpenQueue,
}: PlayerHeaderProps) {
	return (
		<View style={styles.header}>
			<View style={styles.swipeIndicator}>
				<View style={[styles.swipeBar, { backgroundColor: colors.textSecondary }]} />
			</View>

			<Pressable
				style={styles.closeButton}
				onPress={onClose}
				hitSlop={HEADER_HIT_SLOP}
				accessibilityRole="button"
				accessibilityLabel="Fermer le lecteur"
			>
				<View style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}>
					<Ionicons name="chevron-down" size={24} color={colors.text} />
				</View>
			</Pressable>

			<Pressable
				style={styles.devicesButton}
				onPress={onOpenDevices}
				hitSlop={HEADER_HIT_SLOP}
				accessibilityRole="button"
				accessibilityLabel="Choisir l'appareil"
			>
				<View style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}>
					<Ionicons name="phone-portrait-outline" size={20} color={colors.text} />
				</View>
			</Pressable>

			<Pressable
				style={styles.queueButton}
				onPress={onOpenQueue}
				hitSlop={HEADER_HIT_SLOP}
				accessibilityRole="button"
				accessibilityLabel="File d'attente"
			>
				<View style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}>
					<Ionicons name="list" size={22} color={colors.text} />
				</View>
			</Pressable>

			<Text style={[styles.nowPlayingText, { color: colors.textSecondary }]}>
				EN COURS DE LECTURE
			</Text>
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
	);
}
