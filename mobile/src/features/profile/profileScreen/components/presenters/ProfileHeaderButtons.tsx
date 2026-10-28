import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';

interface ProfileHeaderButtonsProps {
	onEditProfile: () => void;
	onSettings: () => void;
}

export function ProfileHeaderButtons({ onEditProfile, onSettings }: ProfileHeaderButtonsProps) {
	const { theme } = useTheme();

	return (
		<View style={styles.container}>
			<Pressable
				onPress={onEditProfile}
				accessibilityRole="button"
				accessibilityLabel="Modifier le profil"
				style={styles.button}
			>
				<PixelIcon name="pencil" size={24} color={theme.colors.text} />
			</Pressable>
			<Pressable
				onPress={onSettings}
				accessibilityRole="button"
				accessibilityLabel="Réglages"
				style={styles.button}
			>
				<PixelIcon name="gear" size={24} color={theme.colors.text} />
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
	},
	button: {
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
	},
});
