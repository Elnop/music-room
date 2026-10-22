import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';

/** What an `Input` needs from a react-hook-form text field. */
export interface FieldBinding {
	value: string;
	onChangeText: (text: string) => void;
	error?: string;
}

/** Binds the text field `name` of a form to an `Input`. */
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
