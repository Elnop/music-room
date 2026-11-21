import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/components/PixelIcon';
import { LoadingSpinner } from '@/shared/theme/components/LoadingSpinner';
import { ThemedSwitch } from '@/shared/theme/components/ThemedSwitch';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { createSharingStyles } from '@/features/playlists/features/editor/features/sharing/components/presenters/sharingStyles';
import { Text } from '@/shared/theme/components/Text';

interface SettingRowProps {
	icon: PixelIconSource;
	label: string;
	description: string;
	value: boolean;
	onToggle: () => void;
	busy: boolean;
}

export function SettingRow({ icon, label, description, value, onToggle, busy }: SettingRowProps) {
	const { styles: shared } = useThemedStyles(createSharingStyles);
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={[shared.card, shared.row, styles.item]}>
			<View style={styles.info}>
				<View style={styles.iconContainer}>
					<PixelIcon icon={icon} size={20} color={theme.colors.primary} />
				</View>
				<View style={styles.text}>
					<Text style={styles.label}>{label}</Text>
					<Text style={styles.description}>{description}</Text>
				</View>
			</View>
			{busy ? (
				<LoadingSpinner size="small" />
			) : (
				<ThemedSwitch value={value} onValueChange={onToggle} />
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		item: {
			justifyContent: 'space-between',
		},
		info: {
			flexDirection: 'row',
			alignItems: 'center',
			flex: 1,
			marginRight: theme.spacing.md,
		},
		iconContainer: {
			width: 36,
			height: 36,
			backgroundColor: theme.colors.primary + '15',
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.md,
		},
		text: {
			flex: 1,
		},
		label: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		description: {
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
	});
}
