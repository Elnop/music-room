import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/shared/types/supabase.helpers.js";

// Database types (now using Supabase generated types)
export type FollowRow = Tables<"follows">;
export type FollowInsert = TablesInsert<"follows">;
export type FollowUpdate = TablesUpdate<"follows">;

export interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isFriend: boolean;
  followersCount: number;
  followingCount: number;
}

export interface FollowActionResponse {
  success: boolean;
  status: FollowStatus;
}
