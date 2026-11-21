import React from 'react';
import { StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Input } from '@/shared/theme/components/Input';
import { Text } from '@/shared/theme/components/Text';
import { RenameDeviceActions } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/RenameDeviceActions';
import { DEVICE_NAME_MAX_LENGTH } from '@/features/playback/features/control-delegation/features/my-devices/myDevicesConfig';
import type { RenameForm } from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';

type RenameDeviceFormProps = {
	saving: boolean;
	form: RenameForm;
	onClose: () => void;
};

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		title: {
			fontSize: theme.typography.sizes.lgxl,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
			marginBottom: theme.spacing.md,
		},
	});
	return styles;
}

export function RenameDeviceForm({ saving, form, onClose }: RenameDeviceFormProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<>
			<Text style={styles.title}>Renommer l'appareil</Text>
			<Input
				label="Nom de l'appareil"
				value={form.name}
				onChangeText={form.onChangeName}
				error={form.error}
				maxLength={DEVICE_NAME_MAX_LENGTH}
				autoFocus
				returnKeyType="done"
				onSubmitEditing={form.onSave}
				editable={!saving}
			/>
			<RenameDeviceActions saving={saving} form={form} onClose={onClose} />
		</>
	);
}
