import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import CogSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/cog-solid.svg';
import PencilSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pencil-solid.svg';

type ProfileHeaderButtonsProps = {
	onEditProfile: () => void;
	onSettings: () => void;
};

export function ProfileHeaderButtons({ onEditProfile, onSettings }: ProfileHeaderButtonsProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={styles.container}>
			<Pressable
				onPress={onEditProfile}
				accessibilityRole="button"
				accessibilityLabel="Modifier le profil"
				style={styles.button}
			>
				<PixelIcon icon={PencilSolid} size={24} color={theme.colors.text} />
			</Pressable>
			<Pressable
				onPress={onSettings}
				accessibilityRole="button"
				accessibilityLabel="Réglages"
				style={styles.button}
			>
				<PixelIcon icon={CogSolid} size={24} color={theme.colors.text} />
			</Pressable>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			flexDirection: 'row',
		},
		button: {
			width: theme.controls.headerButton,
			height: theme.controls.headerButton,
			alignItems: 'center',
			justifyContent: 'center',
		},
	});
	return styles;
}
