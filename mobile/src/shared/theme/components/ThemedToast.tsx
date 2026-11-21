import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/components/PixelIcon';
import type { ToastConfigParams } from 'react-native-toast-message';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/lib/types';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { FONT_FAMILIES } from '@/shared/theme/lib/fonts';
import CheckSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/check-solid.svg';
import ExclamationTriangleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/exclamation-triangle-solid.svg';
import InfoCircleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/info-circle-solid.svg';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

const ICONS: Record<ToastKind, PixelIconSource> = {
	success: CheckSolid,
	error: ExclamationTriangleSolid,
	info: InfoCircleSolid,
	warning: ExclamationTriangleSolid,
};

type ThemedToastProps = {
	kind: ToastKind;
	params: ToastConfigParams<unknown>;
	theme: Theme;
};

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
			style={[styles.container, { borderColor: color }]}
		>
			<PixelIcon icon={ICONS[kind]} size={22} color={color} style={styles.icon} />
			<View style={styles.texts}>
				{params.text1 ? <Text style={styles.text1}>{params.text1}</Text> : null}
				{params.text2 ? <Text style={styles.text2}>{params.text2}</Text> : null}
			</View>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			width: '90%',
			minHeight: 56,
			...pixelFrame(theme),
			backgroundColor: theme.colors.surface,
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.sm,
			...theme.shadows.medium,
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
			fontFamily: FONT_FAMILIES.semibold,
		},
		text2: {
			color: theme.colors.textSecondary,
			fontSize: 12,
			marginTop: 2,
		},
	});
	return styles;
}
