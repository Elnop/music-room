import React from 'react';
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { ToastConfigParams } from 'react-native-toast-message';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { ToastTexts } from '@/shared/theme/components/ToastTexts';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import { toastAccessibilityLabel } from '@/shared/theme/lib/toastAccessibilityLabel';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { ToastKind } from '@/shared/theme/types/toastTypes';
import CheckSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/check-solid.svg';
import ExclamationTriangleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/exclamation-triangle-solid.svg';
import InfoCircleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/info-circle-solid.svg';

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

function borderColorStyle(color: string): ViewStyle {
	return { borderColor: color };
}

export function ThemedToast({ kind, params, theme }: ThemedToastProps) {
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const color = theme.colors[kind];

	return (
		<Pressable
			testID={`toast-${kind}`}
			onPress={params.onPress}
			accessibilityRole="alert"
			accessibilityLabel={toastAccessibilityLabel(params)}
			accessibilityLiveRegion="polite"
			style={[styles.container, borderColorStyle(color)]}
		>
			<PixelIcon icon={ICONS[kind]} size={22} color={color} style={styles.icon} />
			<ToastTexts text1={params.text1} text2={params.text2} theme={theme} />
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			width: '90%',
			minHeight: theme.controls.toast,
			...pixelFrame(theme),
			backgroundColor: theme.colors.surface,
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.sm,
			...theme.shadows.medium,
		},
		icon: {
			marginRight: theme.spacing.md,
		},
	});
	return styles;
}
