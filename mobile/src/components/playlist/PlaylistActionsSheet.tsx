import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@/themes/types';

interface PlaylistActionsSheetProps {
	visible: boolean;
	/** Shown as the sheet's title. */
	playlistName: string;
	onClose: () => void;
	onEdit: () => void;
	onSharing: () => void;
	onDelete: () => void;
}

/**
 * The owner's actions on their playlist (#342): edit its name and description,
 * open « Visibilité et droits », delete it. The screen shows it only to the
 * owner and handles each action; the sheet closes before the action runs. On
 * iOS the action waits for the Modal's onDismiss: an Alert raised while the
 * Modal is still sliding out may be dropped.
 */
export function PlaylistActionsSheet({
	visible,
	playlistName,
	onClose,
	onEdit,
	onSharing,
	onDelete,
}: PlaylistActionsSheetProps) {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = React.useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);

	// iOS: the action chosen, run once the Modal is gone.
	const pendingRef = React.useRef<(() => void) | null>(null);

	const run = (action: () => void) => () => {
		if (Platform.OS === 'ios') {
			pendingRef.current = action;
			onClose();
			return;
		}
		onClose();
		action();
	};

	const handleDismiss = () => {
		const action = pendingRef.current;
		pendingRef.current = null;
		action?.();
	};

	const renderAction = (
		icon: keyof typeof Ionicons.glyphMap,
		label: string,
		onPress: () => void,
		destructive = false
	) => {
		const color = destructive ? theme.colors.error : theme.colors.text;
		return (
			<TouchableOpacity
				style={styles.row}
				onPress={run(onPress)}
				activeOpacity={0.7}
				accessibilityRole="button"
				accessibilityLabel={label}
			>
				<Ionicons name={icon} size={22} color={color} style={styles.rowIcon} />
				<Text style={[styles.rowText, { color }]}>{label}</Text>
			</TouchableOpacity>
		);
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent
			onRequestClose={onClose}
			onDismiss={handleDismiss}
		>
			<Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer" />
			<View style={styles.sheet}>
				<View style={styles.header}>
					<Text style={styles.title} numberOfLines={1}>
						{playlistName}
					</Text>
				</View>
				<View>
					{renderAction('create-outline', 'Modifier', onEdit)}
					{renderAction('lock-closed-outline', 'Visibilité et droits', onSharing)}
					{renderAction('trash-outline', 'Supprimer', onDelete, true)}
				</View>
			</View>
		</Modal>
	);
}

const createStyles = (theme: Theme, bottomInset: number) =>
	StyleSheet.create({
		backdrop: {
			flex: 1,
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
		},
		sheet: {
			backgroundColor: theme.colors.background,
			borderTopLeftRadius: 16,
			borderTopRightRadius: 16,
			paddingBottom: bottomInset + theme.spacing.md,
		},
		header: {
			paddingHorizontal: theme.spacing.lg,
			paddingVertical: theme.spacing.md,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
		},
		title: {
			fontSize: 17,
			fontWeight: '700',
			color: theme.colors.text,
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: theme.spacing.lg,
			paddingVertical: 14,
		},
		rowIcon: {
			marginRight: theme.spacing.md,
		},
		rowText: {
			flex: 1,
			fontSize: 16,
		},
	});
