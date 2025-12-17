import { supabase } from "@/shared/config/supabase.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import type { SupabaseUser } from "../auth.types.js";

/**
 * Service for session and token management
 */
export class SessionService {
  /**
   * Verify JWT token and return user
   */
  async verifyToken(token: string): Promise<SupabaseUser> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        throw new AppError(401, "Invalid or expired token", "INVALID_TOKEN");
      }

      return {
        id: user.id,
        email: user.email!,
        role: user.role,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(401, "Invalid token", "INVALID_TOKEN");
    }
  }
}
