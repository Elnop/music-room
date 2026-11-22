import React from 'react';
import { Input } from '@/shared/theme/components/Input';
import type {
	FieldBinding,
	FieldSpec,
} from '@/features/user/features/auth/shared/field-binding/fieldBindingTypes';

type BoundFieldsProps<K extends string> = {
	fields: readonly FieldSpec<K>[];
	bindings: Record<NoInfer<K>, FieldBinding>;
	onEnter?: () => void;
};

export function BoundFields<K extends string>({ fields, bindings, onEnter }: BoundFieldsProps<K>) {
	return (
		<>
			{fields.map((field) => (
				<Input
					key={field.name}
					label={field.label}
					{...bindings[field.name]}
					placeholder={field.placeholder}
					keyboardType={field.keyboardType}
					secureTextEntry={field.secureTextEntry}
					autoCapitalize="none"
					onEnter={onEnter}
				/>
			))}
		</>
	);
}
