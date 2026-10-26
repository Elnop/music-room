export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	public: {
		Tables: {
			device_control_licenses: {
				Row: {
					created_at: string;
					device_id: string;
					grantee_id: string;
					owner_id: string;
				};
				Insert: {
					created_at?: string;
					device_id: string;
					grantee_id: string;
					owner_id: string;
				};
				Update: {
					created_at?: string;
					device_id?: string;
					grantee_id?: string;
					owner_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'device_control_licenses_device_fkey';
						columns: ['owner_id', 'device_id'];
						isOneToOne: false;
						referencedRelation: 'devices';
						referencedColumns: ['user_id', 'device_id'];
					},
					{
						foreignKeyName: 'device_control_licenses_follow_fkey';
						columns: ['grantee_id', 'owner_id'];
						isOneToOne: false;
						referencedRelation: 'follows';
						referencedColumns: ['follower_id', 'following_id'];
					},
				];
			};
			devices: {
				Row: {
					created_at: string;
					custom_name: string | null;
					device_id: string;
					device_name: string;
					last_seen_at: string;
					model: string;
					platform: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					custom_name?: string | null;
					device_id: string;
					device_name?: string;
					last_seen_at?: string;
					model?: string;
					platform?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					custom_name?: string | null;
					device_id?: string;
					device_name?: string;
					last_seen_at?: string;
					model?: string;
					platform?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'devices_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'user_profiles';
						referencedColumns: ['id'];
					},
				];
			};
			follows: {
				Row: {
					can_control_music: boolean | null;
					created_at: string | null;
					follower_id: string;
					following_id: string;
				};
				Insert: {
					can_control_music?: boolean | null;
					created_at?: string | null;
					follower_id: string;
					following_id: string;
				};
				Update: {
					can_control_music?: boolean | null;
					created_at?: string | null;
					follower_id?: string;
					following_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'follows_follower_id_fkey';
						columns: ['follower_id'];
						isOneToOne: false;
						referencedRelation: 'user_profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'follows_following_id_fkey';
						columns: ['following_id'];
						isOneToOne: false;
						referencedRelation: 'user_profiles';
						referencedColumns: ['id'];
					},
				];
			};
			music_preferences: {
				Row: {
					genres: string[] | null;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					genres?: string[] | null;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					genres?: string[] | null;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'music_preferences_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: true;
						referencedRelation: 'user_profiles';
						referencedColumns: ['id'];
					},
				];
			};
			play_queue_items: {
				Row: {
					added_at: string;
					block_detached: boolean;
					block_id: string | null;
					id: string;
					rank: string;
					source_playlist_id: string | null;
					track_id: string;
					user_id: string;
				};
				Insert: {
					added_at?: string;
					block_detached?: boolean;
					block_id?: string | null;
					id?: string;
					rank: string;
					source_playlist_id?: string | null;
					track_id: string;
					user_id: string;
				};
				Update: {
					added_at?: string;
					block_detached?: boolean;
					block_id?: string | null;
					id?: string;
					rank?: string;
					source_playlist_id?: string | null;
					track_id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'play_queue_items_source_playlist_id_fkey';
						columns: ['source_playlist_id'];
						isOneToOne: false;
						referencedRelation: 'playlists';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'play_queue_items_track_id_fkey';
						columns: ['track_id'];
						isOneToOne: false;
						referencedRelation: 'tracks';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'play_queue_items_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'play_queues';
						referencedColumns: ['user_id'];
					},
				];
			};
			play_queues: {
				Row: {
					current_item_id: string | null;
					updated_at: string;
					user_id: string;
					version: number;
				};
				Insert: {
					current_item_id?: string | null;
					updated_at?: string;
					user_id: string;
					version?: number;
				};
				Update: {
					current_item_id?: string | null;
					updated_at?: string;
					user_id?: string;
					version?: number;
				};
				Relationships: [
					{
						foreignKeyName: 'play_queues_current_item_fkey';
						columns: ['current_item_id', 'user_id'];
						isOneToOne: false;
						referencedRelation: 'play_queue_items';
						referencedColumns: ['id', 'user_id'];
					},
				];
			};
			playlist_tracks: {
				Row: {
					added_at: string | null;
					added_by: string | null;
					id: string;
					moved_at_version: number;
					playlist_id: string;
					rank: string;
					track_id: string;
				};
				Insert: {
					added_at?: string | null;
					added_by?: string | null;
					id?: string;
					moved_at_version?: number;
					playlist_id: string;
					rank: string;
					track_id: string;
				};
				Update: {
					added_at?: string | null;
					added_by?: string | null;
					id?: string;
					moved_at_version?: number;
					playlist_id?: string;
					rank?: string;
					track_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'playlist_tracks_added_by_fkey';
						columns: ['added_by'];
						isOneToOne: false;
						referencedRelation: 'user_profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'playlist_tracks_playlist_id_fkey';
						columns: ['playlist_id'];
						isOneToOne: false;
						referencedRelation: 'playlists';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'playlist_tracks_track_id_fkey';
						columns: ['track_id'];
						isOneToOne: false;
						referencedRelation: 'tracks';
						referencedColumns: ['id'];
					},
				];
			};
			playlists: {
				Row: {
					collaborator_ids: string[] | null;
					cover_url: string | null;
					created_at: string | null;
					description: string | null;
					edit_mode: string;
					id: string;
					name: string;
					owner_id: string;
					ranks_rebalanced_at_version: number;
					tracks_version: number;
					updated_at: string | null;
					viewer_ids: string[] | null;
					visibility: string;
				};
				Insert: {
					collaborator_ids?: string[] | null;
					cover_url?: string | null;
					created_at?: string | null;
					description?: string | null;
					edit_mode?: string;
					id?: string;
					name: string;
					owner_id: string;
					ranks_rebalanced_at_version?: number;
					tracks_version?: number;
					updated_at?: string | null;
					viewer_ids?: string[] | null;
					visibility: string;
				};
				Update: {
					collaborator_ids?: string[] | null;
					cover_url?: string | null;
					created_at?: string | null;
					description?: string | null;
					edit_mode?: string;
					id?: string;
					name?: string;
					owner_id?: string;
					ranks_rebalanced_at_version?: number;
					tracks_version?: number;
					updated_at?: string | null;
					viewer_ids?: string[] | null;
					visibility?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'playlists_owner_id_fkey';
						columns: ['owner_id'];
						isOneToOne: false;
						referencedRelation: 'user_profiles';
						referencedColumns: ['id'];
					},
				];
			};
			profile_privacy: {
				Row: {
					avatar_visibility: Database['public']['Enums']['visibility_level'] | null;
					bio_visibility: Database['public']['Enums']['visibility_level'] | null;
					created_at: string | null;
					email_visibility: Database['public']['Enums']['visibility_level'] | null;
					music_preferences_visibility: Database['public']['Enums']['visibility_level'] | null;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					avatar_visibility?: Database['public']['Enums']['visibility_level'] | null;
					bio_visibility?: Database['public']['Enums']['visibility_level'] | null;
					created_at?: string | null;
					email_visibility?: Database['public']['Enums']['visibility_level'] | null;
					music_preferences_visibility?: Database['public']['Enums']['visibility_level'] | null;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					avatar_visibility?: Database['public']['Enums']['visibility_level'] | null;
					bio_visibility?: Database['public']['Enums']['visibility_level'] | null;
					created_at?: string | null;
					email_visibility?: Database['public']['Enums']['visibility_level'] | null;
					music_preferences_visibility?: Database['public']['Enums']['visibility_level'] | null;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'profile_privacy_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: true;
						referencedRelation: 'user_profiles';
						referencedColumns: ['id'];
					},
				];
			};
			tracks: {
				Row: {
					album: string | null;
					album_art: string | null;
					artist: string;
					availability_checked_at: string | null;
					created_at: string | null;
					duration_ms: number;
					id: string;
					preview_url: string | null;
					title: string;
					track_uri: string;
					unavailable_at: string | null;
					updated_at: string | null;
				};
				Insert: {
					album?: string | null;
					album_art?: string | null;
					artist: string;
					availability_checked_at?: string | null;
					created_at?: string | null;
					duration_ms: number;
					id?: string;
					preview_url?: string | null;
					title: string;
					track_uri: string;
					unavailable_at?: string | null;
					updated_at?: string | null;
				};
				Update: {
					album?: string | null;
					album_art?: string | null;
					artist?: string;
					availability_checked_at?: string | null;
					created_at?: string | null;
					duration_ms?: number;
					id?: string;
					preview_url?: string | null;
					title?: string;
					track_uri?: string;
					unavailable_at?: string | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			user_profiles: {
				Row: {
					avatar_url: string | null;
					bio: string | null;
					created_at: string | null;
					display_name: string | null;
					email_verified: boolean | null;
					facebook_id: string | null;
					favorite_artist: string | null;
					google_id: string | null;
					has_password: boolean | null;
					id: string;
					password_reset_code: string | null;
					password_reset_code_expires_at: string | null;
					updated_at: string | null;
					username: string;
					verification_code: string | null;
					verification_code_expires_at: string | null;
				};
				Insert: {
					avatar_url?: string | null;
					bio?: string | null;
					created_at?: string | null;
					display_name?: string | null;
					email_verified?: boolean | null;
					facebook_id?: string | null;
					favorite_artist?: string | null;
					google_id?: string | null;
					has_password?: boolean | null;
					id: string;
					password_reset_code?: string | null;
					password_reset_code_expires_at?: string | null;
					updated_at?: string | null;
					username: string;
					verification_code?: string | null;
					verification_code_expires_at?: string | null;
				};
				Update: {
					avatar_url?: string | null;
					bio?: string | null;
					created_at?: string | null;
					display_name?: string | null;
					email_verified?: boolean | null;
					facebook_id?: string | null;
					favorite_artist?: string | null;
					google_id?: string | null;
					has_password?: boolean | null;
					id?: string;
					password_reset_code?: string | null;
					password_reset_code_expires_at?: string | null;
					updated_at?: string | null;
					username?: string;
					verification_code?: string | null;
					verification_code_expires_at?: string | null;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			find_auth_user_id_by_email: { Args: { p_email: string }; Returns: string };
			playlist_add_track: {
				Args: { p_added_by?: string; p_playlist_id: string; p_track_id: string };
				Returns: Json;
			};
			playlist_lock: { Args: { p_playlist_id: string }; Returns: number };
			playlist_move_track: {
				Args: {
					p_after_rank?: string;
					p_expected_version: number;
					p_playlist_id: string;
					p_track_id: string;
				};
				Returns: Json;
			};
			playlist_rebalance: {
				Args: { p_playlist_id: string; p_version: number };
				Returns: undefined;
			};
			playlist_remove_track: { Args: { p_playlist_id: string; p_track_id: string }; Returns: Json };
			queue_add_item: { Args: { p_track_id: string; p_user: string }; Returns: Json };
			queue_current_rank: { Args: { p_user: string }; Returns: string };
			queue_detach_block: { Args: { p_block_id: string; p_user: string }; Returns: undefined };
			queue_find_item: {
				Args: { p_item_id: string; p_user: string };
				Returns: {
					added_at: string;
					block_detached: boolean;
					block_id: string | null;
					id: string;
					rank: string;
					source_playlist_id: string | null;
					track_id: string;
					user_id: string;
				};
				SetofOptions: {
					from: '*';
					to: 'play_queue_items';
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			queue_history_max: { Args: Record<PropertyKey, never>; Returns: number };
			queue_insert_block: { Args: { p_track_ids: string[]; p_user: string }; Returns: Json };
			queue_lock: { Args: { p_user: string }; Returns: string };
			queue_move_item: {
				Args: { p_after_item_id?: string; p_item_id: string; p_user: string };
				Returns: Json;
			};
			queue_play_item: { Args: { p_item_id: string; p_user: string }; Returns: Json };
			queue_play_playlist: {
				Args: { p_playlist_id: string; p_start_track_id?: string; p_user: string };
				Returns: Json;
			};
			queue_rank_after: {
				Args: { p_after: string; p_exclude: string; p_user: string };
				Returns: string;
			};
			queue_rebalance: { Args: { p_user: string }; Returns: undefined };
			queue_remove_item: { Args: { p_item_id: string; p_user: string }; Returns: Json };
			queue_set_current: { Args: { p_item_id: string; p_user: string }; Returns: undefined };
			queue_state: { Args: { p_user: string }; Returns: Json };
			queue_step: { Args: { p_direction: string; p_user: string }; Returns: Json };
			queue_sync_blocks: { Args: { p_playlist_id: string; p_user: string }; Returns: string[] };
			queue_sync_track_added: {
				Args: { p_playlist_id: string; p_track_id: string };
				Returns: string[];
			};
			queue_sync_track_moved: {
				Args: { p_playlist_id: string; p_track_id: string };
				Returns: string[];
			};
			queue_sync_track_removed: {
				Args: { p_playlist_id: string; p_track_id: string };
				Returns: string[];
			};
			queue_sync_users: { Args: { p_playlist_id: string }; Returns: string[] };
			queue_track_ids_from: { Args: { p_item_id: string; p_user: string }; Returns: string[] };
			queue_track_ids_upcoming: { Args: { p_user: string }; Returns: string[] };
			rank_after: { Args: { p_a: string }; Returns: string };
			rank_between: { Args: { p_a: string; p_b: string }; Returns: string };
			rank_max_length: { Args: Record<PropertyKey, never>; Returns: number };
			rank_spaced: { Args: { p_count: number; p_index: number }; Returns: string };
			track_unavailable: { Args: { p_track_id: string }; Returns: boolean };
		};
		Enums: {
			visibility_level: 'public' | 'friends_only' | 'private';
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
	EnumName extends (DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {
			visibility_level: ['public', 'friends_only', 'private'],
		},
	},
} as const;
