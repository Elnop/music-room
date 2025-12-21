import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

// Client IDs from Google Cloud Console
const WEB_CLIENT_ID =
  "187081511514-6u51m2uorjrb72na2u8monu0jsdfhc13.apps.googleusercontent.com";

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

    // Get ID token
    const idToken = userInfo.idToken;

    if (!idToken) {
      throw new Error("No ID token received from Google");
    }

    return idToken;
  } catch (error: any) {
    // Handle specific error codes
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error("SIGN_IN_CANCELLED");
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error("Sign-in already in progress");
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error("Google Play Services not available");
    } else {
      // Log detailed error for debugging
      console.error('[OAuth] Google Sign-In failed:', {
        errorCode: error.code,
        errorMessage: error.message,
        errorType: error.constructor?.name,
        fullError: error,
      });
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
