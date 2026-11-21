import { useController } from 'react-hook-form';
import type { Control, FieldValues, Path } from 'react-hook-form';
import type { FieldBinding } from '@/features/user/features/auth/shared/field-binding/fieldBindingTypes';

export function useFieldBinding<T extends FieldValues>(
	control: Control<T>,
	name: Path<T>
): FieldBinding {
	const { field, fieldState } = useController({ control, name });
	return {
		value: (field.value as string | undefined) ?? '',
		onChangeText: field.onChange,
		error: fieldState.error?.message,
	};
}
