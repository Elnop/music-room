import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useCappedField } from '@/shared/theme/hooks/useCappedField';
import { useEventPlace } from '@/features/events/features/event-form/hooks/useEventPlace';
import { EVENT_LIMITS } from '@/features/events/features/event-form/eventFormConfig';
import { eventFormSchema } from '@/features/events/features/event-form/eventFormSchemas';
import type { EventFormInput } from '@/features/events/features/event-form/types/eventFormTypes';
import type { MusicEvent } from '@/features/events/eventTypes';

export function useEventFields(edited: MusicEvent | undefined) {
	const form = useForm<EventFormInput>({
		resolver: zodResolver(eventFormSchema),
		defaultValues: {
			name: edited?.name ?? '',
			description: edited?.description ?? '',
			address: edited?.address ?? '',
			accessInfo: edited?.accessInfo ?? '',
		},
	});
	const place = useEventPlace(edited, (address) =>
		form.setValue('address', address, { shouldValidate: true }),
	);
	const fields = {
		name: useCappedField(form.control, 'name', EVENT_LIMITS.NAME_MAX),
		description: useCappedField(form.control, 'description', EVENT_LIMITS.TEXT_MAX),
		address: useCappedField(form.control, 'address', EVENT_LIMITS.ADDRESS_MAX),
		accessInfo: useCappedField(form.control, 'accessInfo', EVENT_LIMITS.TEXT_MAX),
	};
	return { form, place, fields };
}
