import React from 'react';
import { View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { useQueueModalStyles } from '@/features/playback/features/queue-modal/hooks/useQueueModalStyles';
import ChevronDownSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/chevron-down-solid.svg';
import TimesSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/times-solid.svg';

type QueueModalHeaderProps = {
	onClose: () => void;
};

export function QueueModalHeader({ onClose }: QueueModalHeaderProps) {
	const { theme } = useTheme();
	const styles = useQueueModalStyles();
	const { isWide } = useBreakpoint();

	return (
		<View style={styles.header}>
			<Pressable
				onPress={onClose}
				style={styles.closeButton}
				hitSlop={4}
				accessibilityRole="button"
				accessibilityLabel="Fermer la file d'attente"
			>
				<PixelIcon
					icon={isWide ? TimesSolid : ChevronDownSolid}
					size={24}
					color={theme.colors.text}
				/>
			</Pressable>
			<Text style={styles.title}>File d&apos;attente</Text>
		</View>
	);
}
