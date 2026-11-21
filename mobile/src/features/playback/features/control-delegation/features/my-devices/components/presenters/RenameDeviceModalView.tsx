import React from 'react';
import { View, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';
import { Input } from '@/shared/theme/components/Input';
import { Button } from '@/shared/theme/components/Button';
import { Pressable } from '@/shared/theme/components/Pressable';
import { DIALOG_MAX_WIDTH } from '@/shared/theme/lib/layout';
import { Text } from '@/shared/theme/components/Text';

const DEVICE_NAME_MAX_LENGTH = 40;

interface RenameDeviceModalViewProps {
	deviceName: string | null;
	saving: boolean;
	name: string;
	error?: string;
	onChangeName: (name: string) => void;
	onClose: () => void;
	onSave: () => void;
	onReset: () => void;
}

export function RenameDeviceModalView({
	deviceName,
	saving,
	name,
	error,
	onChangeName,
	onClose,
	onSave,
	onReset,
}: RenameDeviceModalViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<Modal visible={deviceName !== null} animationType="fade" transparent onRequestClose={onClose}>
			<KeyboardAvoidingView
				style={styles.backdrop}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />
				<View style={styles.dialog}>
					<Text style={styles.title}>Renommer l'appareil</Text>
					<Input
						label="Nom de l'appareil"
						value={name}
						onChangeText={onChangeName}
						error={error}
						maxLength={DEVICE_NAME_MAX_LENGTH}
						autoFocus
						returnKeyType="done"
						onSubmitEditing={onSave}
						editable={!saving}
					/>
					<Button
						title="Enregistrer"
						onPress={onSave}
						loading={saving}
						fullWidth
						style={styles.button}
					/>
					<Button
						title="Nom d'origine"
						variant="outline"
						onPress={onReset}
						disabled={saving}
						fullWidth
						style={styles.button}
					/>
					<Button
						title="Annuler"
						variant="secondary"
						onPress={onClose}
						disabled={saving}
						fullWidth
						style={styles.button}
					/>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
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
		title: {
			fontSize: 18,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
			marginBottom: theme.spacing.md,
		},
		button: {
			marginTop: theme.spacing.sm,
		},
	});
