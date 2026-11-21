import React from 'react';
import { CappedInput } from '@/shared/theme/components/CappedInput';
import { EventAddressField } from '@/features/events/features/event-form/components/presenters/EventAddressField';
import type { EventForm } from '@/features/events/features/event-form/types/eventFormTypes';

type EventTextFieldsProps = {
	form: EventForm;
};

export function EventTextFields({ form }: EventTextFieldsProps) {
	return (
		<>
			<CappedInput
				field={form.name}
				label="Nom de l'événement"
				placeholder="Soirée sur le toit"
				onEnter={form.isSubmitting ? undefined : form.submit}
			/>
			<CappedInput
				field={form.description}
				label="Description (facultative)"
				placeholder="L'ambiance, le programme…"
				multiline
			/>
			<EventAddressField field={form.address} place={form.place} />
			<CappedInput
				field={form.accessInfo}
				label="Comment y accéder (facultatif)"
				placeholder="Bâtiment C, 7e étage, code 4512"
				multiline
			/>
		</>
	);
}
