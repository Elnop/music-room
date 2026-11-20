import { z } from 'zod';

/** Same limits as the backend (features/events/events.validators.ts). */
export const EVENT_LIMITS = {
	NAME_MAX: 100,
	TEXT_MAX: 500,
	ADDRESS_MAX: 200,
	GENRES_MAX: 5,
} as const;

export const eventFormSchema = z.object({
	name: z.string().trim().min(1, "Donnez un nom à l'événement").max(EVENT_LIMITS.NAME_MAX),
	description: z.string().max(EVENT_LIMITS.TEXT_MAX),
	address: z.string().trim().min(1, "Indiquez l'adresse").max(EVENT_LIMITS.ADDRESS_MAX),
	accessInfo: z.string().max(EVENT_LIMITS.TEXT_MAX),
});

export type EventFormInput = z.infer<typeof eventFormSchema>;
