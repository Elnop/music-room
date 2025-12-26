import { OAuth2Client } from "google-auth-library";
import { AppError } from "../../../shared/middleware/error-handler.js";
import { logger } from "../../../shared/utils/logger.js";
import { GoogleTokenPayload, FacebookTokenPayload } from "../auth.types.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

if (!GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID environment variable is not set");
}

if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
  throw new Error(
    "FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables must be set",
  );
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
        sub: payload.sub ?? "",
        email: payload.email ?? "",
        email_verified: payload.email_verified ?? false,
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

  /**
   * Verify Facebook access token and extract user information
   * @param accessToken - Access token from Facebook Login
   * @returns Verified token payload with user information
   * @throws AppError if token is invalid or email is not provided
   */
  static async verifyFacebookToken(
    accessToken: string,
  ): Promise<FacebookTokenPayload> {
    try {
      // 1. Verify the access token using Facebook's debug_token endpoint
      const debugUrl = `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}&access_token=${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;

      const debugResponse = await fetch(debugUrl);
      const debugData = await debugResponse.json();

      if (!debugResponse.ok || debugData.data?.error) {
        logger.warn("Facebook token verification failed", {
          error: debugData.data?.error || debugData.error,
        });
        throw new AppError(
          401,
          "Invalid Facebook token",
          "INVALID_FACEBOOK_TOKEN",
        );
      }

      // Check if token is valid and not expired
      if (!debugData.data?.is_valid) {
        logger.warn("Facebook token is not valid or expired");
        throw new AppError(
          401,
          "Invalid or expired Facebook token",
          "INVALID_TOKEN",
        );
      }

      // Check if app_id matches
      if (debugData.data.app_id !== FACEBOOK_APP_ID) {
        logger.warn("Facebook token app_id mismatch", {
          expected: FACEBOOK_APP_ID,
          received: debugData.data.app_id,
        });
        throw new AppError(
          401,
          "Token was not issued for this app",
          "INVALID_TOKEN",
        );
      }

      const userId = debugData.data.user_id;

      // 2. Fetch user profile from Facebook Graph API
      const profileUrl = `https://graph.facebook.com/v21.0/${userId}?fields=id,name,email,picture.type(large)&access_token=${accessToken}`;

      const profileResponse = await fetch(profileUrl);
      const profileData = await profileResponse.json();

      if (!profileResponse.ok || profileData.error) {
        logger.error("Facebook profile fetch failed", {
          error: profileData.error,
        });
        throw new AppError(
          401,
          "Failed to fetch Facebook profile",
          "PROFILE_FETCH_ERROR",
        );
      }

      // Email is optional - if user denies email permission, we'll generate a synthetic email
      if (!profileData.email) {
        logger.info("Facebook login without email permission", {
          userId: profileData.id,
          name: profileData.name,
          note: "Will generate synthetic email for Supabase compatibility",
        });
      }

      logger.info("Facebook token verified successfully", {
        userId: profileData.id,
        email: profileData.email || "not_provided",
        name: profileData.name,
      });

      return {
        id: profileData.id,
        email: profileData.email, // May be undefined
        name: profileData.name,
        picture: profileData.picture?.data?.url,
      };
    } catch (error) {
      // Re-throw AppError as-is
      if (error instanceof AppError) {
        throw error;
      }

      // Log and convert other errors
      logger.error("Facebook token verification failed", { error });
      throw new AppError(
        401,
        "Invalid or expired Facebook token",
        "INVALID_TOKEN",
      );
    }
  }
}
