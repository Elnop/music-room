import React from 'react';
import { View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/theme/ThemeContext';
import { HEADER_HIT_SLOP, type createStyles } from './playerModalStyles';
import ChevronDownSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/chevron-down-solid.svg';
import TimesSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/times-solid.svg';

interface PlayerHeaderProps {
	styles: ReturnType<typeof createStyles>;
	colors: {
		textSecondary: string;
	};
	/** A dialog closes with ×, without the swipe handle of the phone's sheet. */
	dialog?: boolean;
	isLoading?: boolean;
	onClose: () => void;
}

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
