import {
  GoogleSignin,
  statusCodes,
  type User as GoogleUser,
} from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";

// Type guard to safely extract ID token from Google Sign-In response
interface GoogleSignInResponse {
  type?: "success" | "cancelled";
  data?: {
    idToken?: string | null;
    user?: GoogleUser;
  };
  idToken?: string | null;
  user?: GoogleUser;
}

function extractIdToken(response: GoogleSignInResponse): string {
  // Try new structure (data.idToken)
  const idToken = response.data?.idToken || response.idToken;

  if (!idToken) {
    throw new Error(
      "No ID token received from Google Sign-In. Please try again.",
    );
  }

  return idToken;
}

// Get Google OAuth Web Client ID from environment variables
const WEB_CLIENT_ID =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

if (!WEB_CLIENT_ID) {
  throw new Error(
    "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not defined. Please set it in your .env file.",
  );
}

/**
 * Configure Google Sign-In SDK
 * Must be called before using any Google Sign-In features
 *
 * Note: webClientId is used for both Android and iOS to get ID tokens
 * The androidClientId parameter has been deprecated
 */
export const configureGoogleSignIn = (): void => {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID, // Required to get ID tokens
    offlineAccess: false, // Don't request refresh token from Google
  });
};

/**
 * Sign in with Google and get ID token
 * @returns Google ID token (JWT) to send to backend
 * @throws Error if sign-in fails or user cancels
 */
export const signInWithGoogle = async (): Promise<string> => {
  try {
    // Check if device supports Google Play Services (Android)
    await GoogleSignin.hasPlayServices();

    // Open Google consent screen
    const userInfo = await GoogleSignin.signIn();

    // Extract ID token from response using type-safe helper
    const idToken = extractIdToken(userInfo as GoogleSignInResponse);

    // Log what Google returned for debugging (only in development)
    if (__DEV__) {
      const response = userInfo as GoogleSignInResponse;
      console.log('[OAuth] Google Sign-In response:', {
        hasIdToken: !!idToken,
        hasUser: !!response.user || !!response.data?.user,
        user: response.user || response.data?.user,
      });
    }

    console.log('[OAuth] ID token received successfully');

    return idToken;
  } catch (error: unknown) {
    // Handle specific error codes
    const googleError = error as { code?: string; message?: string };

    if (googleError.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error("SIGN_IN_CANCELLED");
    } else if (googleError.code === statusCodes.IN_PROGRESS) {
      throw new Error("Sign-in already in progress");
    } else if (googleError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error("Google Play Services not available");
    } else {
      // Log detailed error for debugging (only in development)
      if (__DEV__) {
        console.error('[OAuth] Google Sign-In failed:', {
          errorCode: googleError.code,
          errorMessage: googleError.message,
          errorType: error?.constructor?.name,
          fullError: error,
        });
      } else {
        console.error('[OAuth] Google Sign-In failed:', {
          errorCode: googleError.code,
          errorMessage: googleError.message,
        });
      }
      throw error;
    }
  }
};

/**
 * Sign out from Google (optional, for complete logout)
 */
export const signOutGoogle = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.error("Error signing out from Google:", error);
  }
};

/**
 * Check if user is already signed in to Google
 */
export const isSignedIn = async (): Promise<boolean> => {
  return await GoogleSignin.isSignedIn();
};
