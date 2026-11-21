import { z } from 'zod';
import { EVENT_LIMITS } from '@/features/events/features/event-form/eventFormConfig';

export const eventFormSchema = z.object({
	name: z.string().trim().min(1, "Donnez un nom à l'événement").max(EVENT_LIMITS.NAME_MAX),
	description: z.string().max(EVENT_LIMITS.TEXT_MAX),
	address: z.string().trim().min(1, "Indiquez l'adresse").max(EVENT_LIMITS.ADDRESS_MAX),
	accessInfo: z.string().max(EVENT_LIMITS.TEXT_MAX),
});
