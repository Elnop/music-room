import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";
import type { Database } from "@/shared/types/supabase.generated.js";

/**
 * Supabase client with SERVICE_ROLE key for backend operations
 * This client bypasses Row Level Security (RLS) policies
 * Use with caution and only for admin/server-side operations
 *
 * IMPORTANT: This client is now fully typed with the Database type!
 * All queries will have proper TypeScript autocomplete and type checking.
 */
export const supabaseAdmin = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

/**
 * Supabase client with ANON key
 * This client respects Row Level Security (RLS) policies
 * Use for user-specific operations where RLS should apply
 *
 * IMPORTANT: This client is now fully typed with the Database type!
 * All queries will have proper TypeScript autocomplete and type checking.
 */
export const supabaseAnon = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

/**
 * Default export for convenience (admin client)
 */
export const supabase = supabaseAdmin;
