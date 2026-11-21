import React from 'react';
import { StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Button } from '@/shared/theme/components/Button';
import type { RenameForm } from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';

type RenameDeviceActionsProps = {
	saving: boolean;
	form: RenameForm;
	onClose: () => void;
};

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		button: { marginTop: theme.spacing.sm },
	});
	return styles;
}

export function RenameDeviceActions({ saving, form, onClose }: RenameDeviceActionsProps) {
	const { styles } = useThemedStyles(createStyles);
	const shared = { fullWidth: true, style: styles.button };

	return (
		<>
			<Button title="Enregistrer" onPress={form.onSave} loading={saving} {...shared} />
			<Button
				title="Nom d'origine"
				variant="outline"
				onPress={form.onReset}
				disabled={saving}
				{...shared}
			/>
			<Button title="Annuler" variant="secondary" onPress={onClose} disabled={saving} {...shared} />
		</>
	);
}
