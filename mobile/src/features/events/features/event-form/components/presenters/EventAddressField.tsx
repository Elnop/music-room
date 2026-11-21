import React from 'react';
import { Button } from '@/shared/theme/components/Button';
import { CappedInput } from '@/shared/theme/components/CappedInput';
import type { CappedField } from '@/shared/theme/types/cappedFieldTypes';
import type { EventPlace } from '@/features/events/features/event-form/types/eventFormTypes';

type EventAddressFieldProps = {
	field: CappedField;
	place: EventPlace;
};

export function EventAddressField({ field, place }: EventAddressFieldProps) {
	return (
		<>
			<CappedInput field={field} label="Adresse" placeholder="96 bd Bessières, Paris" />
			<Button
				title="Utiliser ma position actuelle"
				variant="outline"
				onPress={place.locateHere}
				loading={place.isLocating}
				fullWidth
			/>
		</>
	);
}
