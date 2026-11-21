import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import ExclamationTriangleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/exclamation-triangle-solid.svg';
import RefreshSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/refresh-solid.svg';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { ConnectionStatus } from '@/features/shell/types/connectionTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { textColorOn } from '@/features/shell/lib/textContrast';
import { Text } from '@/shared/theme/components/Text';
import { ConnectionRetryButton } from '@/features/shell/components/presenters/ConnectionRetryButton';

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
	const { styles, theme } = useThemedStyles(createStyles);

	if (!status) return null;

	const failed = status === 'failed';
	const background = failed ? theme.colors.error : theme.colors.warning;
	const color = textColorOn(background);

	return (
		<View
			style={bannerStyle(background, topInset)}
			accessibilityRole="alert"
			accessibilityLiveRegion="polite"
			testID="connection-banner"
		>
			<View style={styles.row}>
				<PixelIcon icon={ICONS[status]} size={16} color={color} />
				<Text style={[styles.text, inkStyle(color)]}>{COPY[status]}</Text>
				{failed && <ConnectionRetryButton fill={color} ink={background} onRetry={onRetry} />}
			</View>
		</View>
	);
}

function bannerStyle(backgroundColor: string, paddingTop: number): ViewStyle {
	return { backgroundColor, paddingTop };
}

function inkStyle(color: string): TextStyle {
	return { color };
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
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
	});
	return styles;
}
