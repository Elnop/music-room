import React from 'react';
import { View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { HEADER_HIT_SLOP } from '@/features/playback/features/player-modal/components/presenters/playerModalStyles';
import type { createStyles } from '@/features/playback/features/player-modal/components/presenters/playerModalStyles';
import ChevronDownSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/chevron-down-solid.svg';
import TimesSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/times-solid.svg';

type PlayerHeaderProps = {
	styles: ReturnType<typeof createStyles>;
	colors: {
		textSecondary: string;
	};
	dialog?: boolean;
	isLoading?: boolean;
	onClose: () => void;
};

export function PlayerHeader({
	styles,
	colors,
	dialog = false,
	isLoading = false,
	onClose,
}: PlayerHeaderProps) {
	const { theme } = useTheme();
	return (
		<View style={styles.header}>
			<View style={styles.swipeIndicator}>
				<View
					style={[
						styles.swipeBar,
						{ backgroundColor: dialog ? 'transparent' : colors.textSecondary },
					]}
				/>
			</View>

			<Pressable
				style={styles.closeButton}
				onPress={onClose}
				hitSlop={HEADER_HIT_SLOP}
				accessibilityRole="button"
				accessibilityLabel="Fermer le lecteur"
			>
				<View style={styles.headerButton}>
					{dialog ? (
						<PixelIcon icon={TimesSolid} size={24} color={theme.colors.text} />
					) : (
						<PixelIcon icon={ChevronDownSolid} color={theme.colors.text} />
					)}
				</View>
			</Pressable>
			{isLoading && (
				<View style={styles.loadingContainer} pointerEvents="none">
					<Text style={[styles.loadingText, { color: colors.textSecondary }]}>
						Chargement du flux audio…
					</Text>
				</View>
			)}
		</View>
	);
}
