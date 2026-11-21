import { useController } from 'react-hook-form';
import type { Control, FieldValues, Path } from 'react-hook-form';
import type { CappedField } from '@/shared/theme/types/cappedFieldTypes';

export function useCappedField<Form extends FieldValues>(
	control: Control<Form>,
	name: Path<Form>,
	max: number
): CappedField {
	const { field, fieldState } = useController({ control, name });
	return {
		value: (field.value as string | undefined) ?? '',
		onChangeText: text => field.onChange(text.slice(0, max)),
		error: fieldState.error?.message,
		max,
	};
}
