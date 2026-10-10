import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';

/**
 * Id of the auth user with this email, ignoring case, or null.
 * One query on auth.users (migration 018), where auth.admin.listUsers()
 * only returns its first page (#194).
 */
export async function findAuthUserIdByEmail(email: string): Promise<string | null> {
	const { data, error } = await supabaseAdmin.rpc('find_auth_user_id_by_email', {
		p_email: email,
	});

	if (error) {
		logger.error('Failed to look up user by email', { error: error.message });
		throw new AppError(500, 'Failed to retrieve user', 'USER_FETCH_ERROR');
	}

	return data ?? null;
}
