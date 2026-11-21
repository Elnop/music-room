import { useController } from 'react-hook-form';
import type { Control, FieldValues, Path } from 'react-hook-form';

export type FieldBinding = {
	value: string;
	onChangeText: (text: string) => void;
	error?: string;
};

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
