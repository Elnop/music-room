import { createClient } from '@supabase/supabase-js';
import { env } from '@/shared/config/env.js';
import type { Database } from '@/shared/types/supabase.generated.js';

/** Bypasses Row Level Security: server-side operations only. */
export const supabaseAdmin = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

export const supabaseAnon = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

/** supabase-js keeps a sign-in's session and then queries as that user, under RLS: never sign in on a shared client. */
export function createSignInClient() {
	return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}
