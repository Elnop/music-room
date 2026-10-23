import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ToastConfigParams } from 'react-native-toast-message';
import type { Theme } from '@/shared/theme/types';
import { Pressable } from '@/shared/components/ui/Pressable';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

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

/** Text in the theme's text colour, not the state colour, so it stays readable. */
export function ThemedToast({ kind, params, theme }: ThemedToastProps) {
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const color = theme.colors[kind];

	return (
		<Pressable
			testID={`toast-${kind}`}
			onPress={params.onPress}
			accessibilityRole="alert"
			accessibilityLabel={[params.text1, params.text2].filter(Boolean).join('. ')}
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

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			width: '90%',
			minHeight: 56,
			backgroundColor: theme.colors.surface,
			borderRadius: 8,
			borderLeftWidth: 4,
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.sm,
			elevation: 4,
			shadowColor: theme.colors.text,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.15,
			shadowRadius: 6,
		},
		icon: {
			marginRight: theme.spacing.md,
		},
		texts: {
			flex: 1,
		},
		text1: {
			color: theme.colors.text,
			fontSize: 14,
			fontWeight: '600',
		},
		text2: {
			color: theme.colors.textSecondary,
			fontSize: 12,
			marginTop: 2,
		},
	});
