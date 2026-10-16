import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast, { type ToastConfig, type ToastConfigParams } from 'react-native-toast-message';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@/themes/types';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

const ICONS: Record<ToastKind, keyof typeof Ionicons.glyphMap> = {
	success: 'checkmark-circle',
	error: 'alert-circle',
	info: 'information-circle',
	warning: 'warning',
};

interface ThemedToastProps {
	kind: ToastKind;
	params: ToastConfigParams<unknown>;
	theme: Theme;
}

/**
 * One toast: the theme's surface with an accent bar and icon in the theme's
 * state colour, the text in the theme's text colour so it stays readable
 * whatever the state colour.
 */
function ThemedToast({ kind, params, theme }: ThemedToastProps) {
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const color = theme.colors[kind];

	return (
		<Pressable
			testID={`toast-${kind}`}
			onPress={params.onPress}
			accessibilityRole="alert"
			accessibilityLiveRegion="polite"
			style={[styles.container, { borderLeftColor: color }]}
		>
			<Ionicons name={ICONS[kind]} size={22} color={color} style={styles.icon} />
			<View style={styles.texts}>
				{params.text1 ? <Text style={styles.text1}>{params.text1}</Text> : null}
				{params.text2 ? <Text style={styles.text2}>{params.text2}</Text> : null}
			</View>
		</Pressable>
	);
}

function buildConfig(theme: Theme): ToastConfig {
	const render = (kind: ToastKind) => (params: ToastConfigParams<unknown>) => (
		<ThemedToast kind={kind} params={params} theme={theme} />
	);
	return {
		success: render('success'),
		error: render('error'),
		info: render('info'),
		warning: render('warning'),
	};
}

/**
 * The app's toast host (#318), themed from `useTheme()`. Mount it inside
 * `ThemeProvider`; native modals mount their own since the root one sits
 * behind them. Toasts are shown through `utils/toast.ts`.
 */
export function AppToast() {
	const { theme } = useTheme();
	const config = React.useMemo(() => buildConfig(theme), [theme]);
	return <Toast config={config} />;
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			width: '90%',
			minHeight: 56,
			paddingVertical: theme.spacing.sm,
			paddingHorizontal: theme.spacing.md,
			backgroundColor: theme.colors.surface,
			borderRadius: theme.borders.small,
			borderLeftWidth: 6,
			...theme.shadows.medium,
		},
		icon: {
			marginRight: theme.spacing.sm,
		},
		texts: {
			flex: 1,
		},
		text1: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
		},
		text2: {
			marginTop: 2,
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
