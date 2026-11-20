import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';

export interface FieldBinding {
	value: string;
	onChangeText: (text: string) => void;
	error?: string;
}

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
