/**
 * Supabase Type Helpers
 *
 * This file provides helper types for working with Supabase generated types.
 * After running `npm run generate-types`, you can use these helpers.
 */

// Import the generated database types (will be created by generate-types script)
// export type { Database } from './supabase.generated';

/**
 * Helper type to extract table row type from Database
 *
 * Usage:
 * type UserProfile = Tables<'user_profiles'>;
 * type Playlist = Tables<'playlists'>;
 */
// export type Tables<T extends keyof Database['public']['Tables']> =
//   Database['public']['Tables'][T]['Row'];

/**
 * Helper type to extract insert type (for creating new records)
 *
 * Usage:
 * type NewUserProfile = Insertable<'user_profiles'>;
 * type NewPlaylist = Insertable<'playlists'>;
 */
// export type Insertable<T extends keyof Database['public']['Tables']> =
//   Database['public']['Tables'][T]['Insert'];

/**
 * Helper type to extract update type (for updating records)
 *
 * Usage:
 * type UpdateUserProfile = Updatable<'user_profiles'>;
 * type UpdatePlaylist = Updatable<'playlists'>;
 */
// export type Updatable<T extends keyof Database['public']['Tables']> =
//   Database['public']['Tables'][T]['Update'];

/**
 * Typed Supabase client creator
 *
 * Usage:
 * import { createTypedClient } from '@/shared/types/supabase.helpers';
 * const supabase = createTypedClient();
 *
 * // Now all queries are fully typed!
 * const { data } = await supabase.from('user_profiles').select('*');
 * // data is typed as UserProfile[]
 */
// import { createClient } from '@supabase/supabase-js';
// import { supabaseUrl, supabaseServiceKey } from '@/shared/config/env';
//
// export function createTypedClient() {
//   return createClient<Database>(supabaseUrl, supabaseServiceKey);
// }

/**
 * PLACEHOLDER FILE
 *
 * This file contains commented-out helper types that will be activated
 * after you generate Supabase types.
 *
 * To generate types:
 * 1. Add SUPABASE_PROJECT_ID to backend/.env
 * 2. Run: npm run generate-types
 * 3. Uncomment the code in this file
 * 4. Update imports in your services
 */

export {};
