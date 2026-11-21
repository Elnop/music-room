import type { z } from 'zod';
import type {
	loginSchema,
	registerSchema,
} from '@/features/user/features/auth/shared/sign-in/authSchemas';

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
