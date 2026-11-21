import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useSeparatorColor } from '@/shared/theme/hooks/useSeparatorColor';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { sheetHeaderStyles } from '@/features/playback/shared/sheet-header/sheetHeaderStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import ChevronDownSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/chevron-down-solid.svg';
import TimesSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/times-solid.svg';

type DevicePickerHeaderProps = {
	onClose: () => void;
};

function createStyles(theme: Theme, separator: string) {
	const { header, closeButton, title } = sheetHeaderStyles(theme, { top: 0 }, separator);
	const styles = StyleSheet.create({ header, closeButton, title });
	return styles;
}

export function DevicePickerHeader({ onClose }: DevicePickerHeaderProps) {
	const { theme } = useTheme();
	const separator = useSeparatorColor();
	const { isWide } = useBreakpoint();
	const styles = React.useMemo(() => createStyles(theme, separator), [theme, separator]);

	return (
		<View style={styles.header}>
			<Pressable
				onPress={onClose}
				style={styles.closeButton}
				hitSlop={4}
				accessibilityRole="button"
				accessibilityLabel="Fermer le choix d'appareil"
			>
				<PixelIcon
					icon={isWide ? TimesSolid : ChevronDownSolid}
					size={24}
					color={theme.colors.text}
				/>
			</Pressable>
			<Text style={styles.title}>Choisir un appareil</Text>
		</View>
	);
}
