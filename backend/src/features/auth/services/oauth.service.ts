import { OAuth2Client } from "google-auth-library";
import { AppError } from "../../../shared/middleware/error-handler.js";
import { logger } from "../../../shared/utils/logger.js";
import { GoogleTokenPayload } from "../auth.types.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID environment variable is not set");
}

export class OAuthService {
  private static client = new OAuth2Client(GOOGLE_CLIENT_ID);

  /**
   * Verify Google ID token and extract user information
   * @param idToken - JWT ID token from Google Sign-In
   * @returns Verified token payload with user information
   * @throws AppError if token is invalid or email is not verified
   */
  static async verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new AppError(401, "Invalid Google token", "INVALID_TOKEN");
      }

      // Security: Reject unverified emails
      if (!payload.email_verified) {
        logger.warn("Google login attempted with unverified email", {
          email: payload.email,
        });
        throw new AppError(
          400,
          "Email not verified with Google",
          "EMAIL_NOT_VERIFIED",
        );
      }

      logger.info("Google token verified successfully", {
        sub: payload.sub,
        email: payload.email,
        email_verified: payload.email_verified,
      });

      return {
        sub: payload.sub!,
        email: payload.email!,
        email_verified: payload.email_verified!,
        name: payload.name,
        picture: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name,
      };
    } catch (error) {
      // Re-throw AppError as-is
      if (error instanceof AppError) {
        throw error;
      }

      // Log and convert other errors
      logger.error("Google token verification failed", { error });
      throw new AppError(
        401,
        "Invalid or expired Google token",
        "INVALID_TOKEN",
      );
    }
  }
}
