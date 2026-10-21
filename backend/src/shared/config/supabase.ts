import { createClient } from '@supabase/supabase-js';
import { env } from '@/shared/config/env.js';
import type { Database } from '@/shared/types/supabase.generated.js';

/**
 * Supabase client with SERVICE_ROLE key for backend operations
 * This client bypasses Row Level Security (RLS) policies
 * Use with caution and only for admin/server-side operations
 *
 * IMPORTANT: This client is now fully typed with the Database type!
 * All queries will have proper TypeScript autocomplete and type checking.
 */
export const supabaseAdmin = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

/**
 * Supabase client with ANON key
 * This client respects Row Level Security (RLS) policies
 * Use for user-specific operations where RLS should apply
 *
 * IMPORTANT: This client is now fully typed with the Database type!
 * All queries will have proper TypeScript autocomplete and type checking.
 */
export const supabaseAnon = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

/**
 * New client for one sign-in call (signInWithPassword, verifyOtp, refreshSession).
 * supabase-js keeps the session a sign-in returns, even with persistSession: false,
 * and then queries PostgREST with that user's JWT instead of its key. Signing in on
 * supabaseAdmin would make every later server query run as that user, under RLS.
 * Never sign in on a shared client.
 */
export function createSignInClient() {
	return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}
