import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import ExclamationTriangleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/exclamation-triangle-solid.svg';
import RefreshSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/refresh-solid.svg';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/components/PixelIcon';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { ConnectionStatus } from '@/features/shell/hooks/useConnectionStatus';
import type { Theme } from '@/shared/theme/lib/types';
import { textColorOn } from '@/features/shell/lib/textContrast';
import { Text } from '@/shared/theme/components/Text';

type ConnectionBannerProps = {
	status: ConnectionStatus;
	topInset: number;
	onRetry: () => void;
};

const COPY: Record<NonNullable<ConnectionStatus>, string> = {
	offline: 'Hors ligne',
	reconnecting: 'Reconnexion…',
	failed: 'Connexion perdue',
};

const ICONS: Record<NonNullable<ConnectionStatus>, PixelIconSource> = {
	offline: ExclamationTriangleSolid,
	reconnecting: RefreshSolid,
	failed: ExclamationTriangleSolid,
};

export function ConnectionBanner({ status, topInset, onRetry }: ConnectionBannerProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme, topInset), [theme, topInset]);

	if (!status) return null;

	const failed = status === 'failed';
	const background = failed ? theme.colors.error : theme.colors.warning;
	const color = textColorOn(background);

	return (
		<View
			style={[styles.container, { backgroundColor: background }]}
			accessibilityRole="alert"
			accessibilityLiveRegion="polite"
			testID="connection-banner"
		>
			<View style={styles.row}>
				<PixelIcon icon={ICONS[status]} size={16} color={color} />
				<Text style={[styles.text, { color }]}>{COPY[status]}</Text>
				{failed && (
					<Pressable
						onPress={onRetry}
						accessibilityLabel="Réessayer"
						hitSlop={8}
						style={[styles.button, { backgroundColor: color }]}
					>
						<Text style={[styles.buttonText, { color: background }]}>Réessayer</Text>
					</Pressable>
				)}
			</View>
		</View>
	);
}

function createStyles(theme: Theme, topInset: number) {
	const styles = StyleSheet.create({
		container: {
			paddingTop: topInset,
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			gap: theme.spacing.sm,
			paddingVertical: theme.spacing.xs,
			paddingHorizontal: theme.spacing.md,
		},
		text: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
		},
		button: {
			marginLeft: theme.spacing.sm,
			paddingVertical: 2,
			paddingHorizontal: theme.spacing.sm,
			borderRadius: theme.borders.round,
		},
		buttonText: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.bold,
		},
	});
	return styles;
}
