import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useSocketStore } from '@store/socketStore';
import type { ConnectionStatus } from '@/hooks/useConnectionStatus';
import type { Theme } from '@themes/types';

interface ConnectionBannerProps {
	/** From useConnectionStatus(); null renders nothing. */
	status: ConnectionStatus;
	/** Status bar height: the banner sits under it, never over it. */
	topInset: number;
}

const COPY: Record<NonNullable<ConnectionStatus>, string> = {
	offline: 'Hors ligne',
	reconnecting: 'Reconnexion…',
	failed: 'Connexion perdue',
};

const ICONS: Record<NonNullable<ConnectionStatus>, keyof typeof Ionicons.glyphMap> = {
	offline: 'cloud-offline-outline',
	reconnecting: 'sync-outline',
	failed: 'alert-circle-outline',
};

const DARK_TEXT = '#111111';
const LIGHT_TEXT = '#FFFFFF';

/** WCAG relative luminance of a #RRGGBB color. */
function luminance(hex: string): number {
	const [r, g, b] = [1, 3, 5].map(i => {
		const c = parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: string, b: string) => {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
};

/** Dark or white text, whichever contrasts most with the background. */
export function textColorOn(background: string): string {
	return contrast(background, DARK_TEXT) >= contrast(background, LIGHT_TEXT)
		? DARK_TEXT
		: LIGHT_TEXT;
}

/** Whether a background needs white text and light status bar icons. */
export function isDarkBackground(background: string): boolean {
	return textColorOn(background) === LIGHT_TEXT;
}

/**
 * Discreet top banner telling the user the app is offline or reconnecting
 * (#315). « Réessayer » restarts the socket once the Manager gave up.
 */
export function ConnectionBanner({ status, topInset }: ConnectionBannerProps) {
	const { theme } = useTheme();
	const retry = useSocketStore(state => state.retry);
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
				<Ionicons name={ICONS[status]} size={16} color={color} />
				<Text style={[styles.text, { color }]}>{COPY[status]}</Text>
				{failed && (
					<Pressable
						onPress={retry}
						accessibilityRole="button"
						hitSlop={8}
						style={({ pressed }) => [
							styles.button,
							{ backgroundColor: color },
							pressed && styles.buttonPressed,
						]}
					>
						<Text style={[styles.buttonText, { color: background }]}>Réessayer</Text>
					</Pressable>
				)}
			</View>
		</View>
	);
}

const createStyles = (theme: Theme, topInset: number) =>
	StyleSheet.create({
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
			fontWeight: theme.typography.weights.semibold,
		},
		button: {
			marginLeft: theme.spacing.sm,
			paddingVertical: 2,
			paddingHorizontal: theme.spacing.sm,
			borderRadius: theme.borders.round,
		},
		buttonPressed: {
			opacity: 0.7,
		},
		buttonText: {
			fontSize: theme.typography.sizes.sm,
			fontWeight: theme.typography.weights.bold,
		},
	});
