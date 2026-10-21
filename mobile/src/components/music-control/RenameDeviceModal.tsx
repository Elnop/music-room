import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Modal,
	Pressable,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';

/** Same bounds as the backend (PATCH /api/music-control/devices/:deviceId). */
const DEVICE_NAME_MAX_LENGTH = 40;

interface RenameDeviceModalProps {
	/** Name shown now; the field starts with it. Null hides the modal. */
	deviceName: string | null;
	/** True while the request runs: the buttons are disabled. */
	saving: boolean;
	onClose: () => void;
	/** The trimmed new name, or null to go back to the system name. */
	onSubmit: (name: string | null) => void;
}

/**
 * Small form to rename one of my devices (#352): the field starts with the
 * current name; « Enregistrer » sends the trimmed name, « Nom d'origine » goes
 * back to the name the system gives.
 */
export function RenameDeviceModal({
	deviceName,
	saving,
	onClose,
	onSubmit,
}: RenameDeviceModalProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const [name, setName] = useState(deviceName ?? '');
	const [error, setError] = useState<string | undefined>();

	// Each opening starts from the device's name (state reset during render,
	// not in an effect).
	const [openedFor, setOpenedFor] = useState(deviceName);
	if (deviceName !== openedFor) {
		setOpenedFor(deviceName);
		if (deviceName !== null) {
			setName(deviceName);
			setError(undefined);
		}
	}

	const handleSave = () => {
		const trimmed = name.trim();
		if (trimmed.length === 0) {
			setError('Saisissez un nom');
			return;
		}
		if (trimmed.length > DEVICE_NAME_MAX_LENGTH) {
			setError(`${DEVICE_NAME_MAX_LENGTH} caractères au maximum`);
			return;
		}
		onSubmit(trimmed);
	};

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
						onChangeText={text => {
							setName(text);
							setError(undefined);
						}}
						error={error}
						maxLength={DEVICE_NAME_MAX_LENGTH}
						autoFocus
						returnKeyType="done"
						onSubmitEditing={handleSave}
						editable={!saving}
					/>
					<Button
						title="Enregistrer"
						onPress={handleSave}
						loading={saving}
						fullWidth
						style={styles.button}
					/>
					<Button
						title="Nom d'origine"
						variant="outline"
						onPress={() => onSubmit(null)}
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
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
		},
		dialog: {
			backgroundColor: theme.colors.background,
			borderRadius: 16,
			padding: theme.spacing.lg,
		},
		title: {
			fontSize: 18,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.text,
			marginBottom: theme.spacing.md,
		},
		button: {
			marginTop: theme.spacing.sm,
		},
	});
