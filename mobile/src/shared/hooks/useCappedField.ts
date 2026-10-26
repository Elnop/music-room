import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';

export interface CappedField {
	value: string;
	onChangeText: (text: string) => void;
	error?: string;
	max: number;
}

/** A text field of a react-hook-form form, cut at `max` characters as the user types. */
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
