import { z } from 'zod';

// Auth Validators (aligned with backend Zod schemas)
export const loginSchema = z.object({
	email: z.email("Format d'email invalide"),
	password: z.string().min(1, 'Le mot de passe est requis'),
});

export const registerSchema = z.object({
	email: z.email("Format d'email invalide"),
	password: z
		.string()
		.min(8, 'Le mot de passe doit contenir au moins 8 caractères')
		.regex(/[A-Z]/, 'Le mot de passe doit contenir une majuscule')
		.regex(/[0-9]/, 'Le mot de passe doit contenir un chiffre')
		.regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir un caractère spécial'),
	username: z
		.string()
		.min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
		.max(20, "Le nom d'utilisateur doit contenir moins de 20 caractères")
		.regex(
			/^[a-zA-Z0-9_]+$/,
			"Le nom d'utilisateur ne peut contenir que des lettres, chiffres et tirets bas"
		),
	displayName: z
		.string()
		.min(1, "Le nom d'affichage ne peut pas être vide")
		.max(50, "Le nom d'affichage doit contenir moins de 50 caractères")
		.optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const playlistFormSchema = z.object({
	name: z
		.string()
		.min(1, 'Le nom de la playlist est requis')
		.max(20, 'Le nom doit faire 20 caractères maximum'),
	description: z.string().max(70, 'La description doit faire 70 caractères maximum').optional(),
});

export type PlaylistFormInput = z.infer<typeof playlistFormSchema>;

export interface PlaylistInput extends PlaylistFormInput {
	visibility?: 'public' | 'private';
	editMode?: 'open' | 'restricted';
}
