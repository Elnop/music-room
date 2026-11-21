import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import type { DimensionValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { AnchoredMenu } from '@/features/playlists/features/editor/shared/action-sheet/components/presenters/AnchoredMenu';
import { CenteredDialog } from '@/shared/theme/components/CenteredDialog';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useSeparatorColor } from '@/shared/theme/hooks/useSeparatorColor';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/lib/types';
import type { MenuAnchor } from '@/shared/theme/lib/menuPlacement';
import { Text } from '@/shared/theme/components/Text';
import { FONT_FAMILIES } from '@/shared/theme/lib/fonts';
import AngleLeftSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/angle-left-solid.svg';

interface ActionSheetProps {
	visible: boolean;
	title?: string;
	subtitle?: string;
	onBack?: () => void;
	onClose: () => void;
	onDismiss?: () => void;
	maxHeight?: DimensionValue;
	anchor?: MenuAnchor | null;
	children: React.ReactNode;
}

export function ActionSheet({
	visible,
	title,
	subtitle,
	onBack,
	onClose,
	onDismiss,
	maxHeight,
	anchor,
	children,
}: ActionSheetProps) {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = React.useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);
	const { isWide } = useBreakpoint();
	const separator = useSeparatorColor();
	const dropDown = isWide && anchor ? anchor : null;

	const sheet = (
		<View
			style={[
				styles.sheet,
				!isWide && maxHeight !== undefined && { maxHeight },
				dropDown && styles.menuSheet,
			]}
		>
			<View style={[styles.header, { borderBottomColor: separator }]}>
				{onBack && (
					<Pressable onPress={onBack} style={styles.backButton} accessibilityLabel="Retour">
						<PixelIcon icon={AngleLeftSolid} size={22} color={theme.colors.text} />
					</Pressable>
				)}
				<View style={styles.headerText}>
					<Text style={styles.title} numberOfLines={1}>
						{title}
					</Text>
					{subtitle !== undefined && (
						<Text style={styles.subtitle} numberOfLines={1}>
							{subtitle}
						</Text>
					)}
				</View>
			</View>
			{children}
		</View>
	);

	return (
		<Modal
			visible={visible}
			animationType={dropDown ? 'none' : isWide ? 'fade' : 'slide'}
			transparent
			onRequestClose={onClose}
			onDismiss={onDismiss}
		>
			{dropDown ? (
				<AnchoredMenu anchor={dropDown} onClose={onClose}>
					{sheet}
				</AnchoredMenu>
			) : isWide ? (
				<CenteredDialog onClose={onClose}>{sheet}</CenteredDialog>
			) : (
				<>
					<Pressable
						style={styles.backdrop}
						onPress={onClose}
						accessibilityRole="none"
						accessibilityLabel="Fermer"
					/>
					{sheet}
				</>
			)}
		</Modal>
	);
}

function createStyles(theme: Theme, bottomInset: number) {
	return StyleSheet.create({
		backdrop: {
			flex: 1,
			backgroundColor: theme.colors.backdrop,
		},
		sheet: {
			...pixelFrame(theme),
			backgroundColor: theme.colors.background,
			paddingBottom: bottomInset + theme.spacing.md,
		},
		menuSheet: {
			borderWidth: 0,
			paddingBottom: theme.spacing.xs,
			backgroundColor: 'transparent',
		},
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: theme.spacing.lg,
			paddingVertical: theme.spacing.md,
			borderBottomWidth: 1,
		},
		backButton: {
			marginRight: theme.spacing.sm,
			padding: theme.spacing.xs,
		},
		headerText: {
			flex: 1,
		},
		title: {
			fontSize: 17,
			fontFamily: FONT_FAMILIES.bold,
			color: theme.colors.text,
		},
		subtitle: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
	});
}
