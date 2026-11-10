import React from 'react';
import { Modal, StyleSheet, View, type DimensionValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { Pressable } from '@/shared/components/ui/Pressable';
import { AnchoredMenu } from '@/shared/components/layout/AnchoredMenu';
import { CenteredDialog } from '@/shared/components/layout/CenteredDialog';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useSeparatorColor } from '@/shared/hooks/useSeparatorColor';
import { useTheme } from '@/shared/theme/ThemeContext';
import { pixelFrame } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import type { MenuAnchor } from '@/shared/utils/menuPlacement';
import { Text } from '@/shared/components/ui/Text';
import { FONT_FAMILIES } from '@/shared/theme/fonts';

interface ActionSheetProps {
	visible: boolean;
	title?: string;
	subtitle?: string;
	/** Shows a back chevron before the title. */
	onBack?: () => void;
	onClose: () => void;
	/** iOS: the Modal finished sliding out. */
	onDismiss?: () => void;
	maxHeight?: DimensionValue;
	/** Wide screens: the button that opened it, to drop down from; without one it is a centred dialog. */
	anchor?: MenuAnchor | null;
	children: React.ReactNode;
}

/** A bottom sheet over a dimmed backdrop that closes it: a title, then rows. */
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
						<PixelIcon name="back" size={22} color={theme.colors.text} />
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

const createStyles = (theme: Theme, bottomInset: number) =>
	StyleSheet.create({
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
