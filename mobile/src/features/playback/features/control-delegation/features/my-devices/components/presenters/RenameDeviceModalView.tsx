import React from 'react';
import { View, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Pressable } from '@/shared/theme/components/Pressable';
import { DIALOG_MAX_WIDTH } from '@/shared/theme/configs/layoutConfig';
import { RenameDeviceForm } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/RenameDeviceForm';
import type { RenameForm } from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';

type RenameDeviceModalViewProps = {
	deviceName: string | null;
	saving: boolean;
	form: RenameForm;
	onClose: () => void;
};

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		backdrop: {
			flex: 1,
			justifyContent: 'center',
			padding: theme.spacing.lg,
			backgroundColor: theme.colors.backdrop,
		},
		dialog: {
			width: '100%',
			maxWidth: DIALOG_MAX_WIDTH,
			alignSelf: 'center',
			backgroundColor: theme.colors.background,
			padding: theme.spacing.lg,
		},
	});
	return styles;
}

export function RenameDeviceModalView({
	deviceName,
	saving,
	form,
	onClose,
}: RenameDeviceModalViewProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<Modal visible={deviceName !== null} animationType="fade" transparent onRequestClose={onClose}>
			<KeyboardAvoidingView
				style={styles.backdrop}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />
				<View style={styles.dialog}>
					<RenameDeviceForm saving={saving} form={form} onClose={onClose} />
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}
