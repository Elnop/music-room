import React from 'react';
import { Modal, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { CenteredDialog } from '@/shared/components/layout/CenteredDialog';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';

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
	children,
}: ActionSheetProps) {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = React.useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);
	const { isWide } = useBreakpoint();

	const sheet = (
		<View style={[styles.sheet, !isWide && maxHeight !== undefined && { maxHeight }]}>
			<View style={styles.header}>
				{onBack && (
					<Pressable onPress={onBack} style={styles.backButton} accessibilityLabel="Retour">
						<Ionicons name="chevron-back" size={22} color={theme.colors.text} />
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
			animationType={isWide ? 'fade' : 'slide'}
			transparent
			onRequestClose={onClose}
			onDismiss={onDismiss}
		>
			{isWide ? (
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
			backgroundColor: theme.colors.background,
			borderTopLeftRadius: 16,
			borderTopRightRadius: 16,
			paddingBottom: bottomInset + theme.spacing.md,
		},
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: theme.spacing.lg,
			paddingVertical: theme.spacing.md,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
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
			fontWeight: '700',
			color: theme.colors.text,
		},
		subtitle: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
	});
