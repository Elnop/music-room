import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { EditProfileCharCount } from '@/features/user/features/profile/features/edit-profile/components/presenters/EditProfileCharCount';
import type {
	EditProfileFieldConfig,
	UpdateProfileInput,
} from '@/features/user/features/profile/features/edit-profile/editProfileTypes';
import { Input } from '@/shared/theme/components/Input';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type EditProfileCappedFieldProps = {
	control: Control<UpdateProfileInput>;
	name: keyof UpdateProfileInput;
	error?: string;
	config: EditProfileFieldConfig;
};

export function EditProfileCappedField({
	control,
	name,
	error,
	config,
}: EditProfileCappedFieldProps) {
	const { styles } = useThemedStyles(createStyles);
	const { field } = useController({ control, name });
	const { max, ...inputOptions } = config;

	return (
		<View>
			<Input
				{...inputOptions}
				value={field.value}
				onChangeText={text => field.onChange(text.slice(0, max))}
				onBlur={field.onBlur}
				error={error}
				style={config.multiline ? styles.multilineInput : undefined}
				maxLength={max}
				containerStyle={styles.input}
			/>
			<EditProfileCharCount length={field.value?.length || 0} max={max} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		input: {
			marginBottom: theme.spacing.sm,
		},
		multilineInput: {
			minHeight: theme.controls.textArea,
			textAlignVertical: 'top',
		},
	});
	return styles;
}
