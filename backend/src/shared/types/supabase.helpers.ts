/**
 * Supabase Type Helpers
 *
 * This file re-exports types from the generated Supabase types file.
 * These types are automatically generated from the database schema.
 *
 * Usage:
 * import type { Tables, TablesInsert, TablesUpdate } from '@/shared/types/supabase.helpers.js';
 *
 * // Row type (SELECT queries)
 * type UserProfile = Tables<'user_profiles'>;
 *
 * // Insert type (INSERT queries)
 * type NewPlaylist = TablesInsert<'playlists'>;
 *
 * // Update type (UPDATE queries)
 * type PlaylistUpdate = TablesUpdate<'playlists'>;
 */

// Re-export the generated database types
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./supabase.generated.js";

// Also export Json type for convenience
export type { Json } from "./supabase.generated.js";
