import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

/**
 * Supabase client with SERVICE_ROLE key for backend operations
 * This client bypasses Row Level Security (RLS) policies
 * Use with caution and only for admin/server-side operations
 */
export const supabaseAdmin = createClient(
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
 */
export const supabaseAnon = createClient(
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
