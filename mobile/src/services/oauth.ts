import {
  GoogleSignin,
  statusCodes,
  type User as GoogleUser,
} from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken, AuthenticationToken, Settings } from 'react-native-fbsdk-next';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Type guard to safely extract ID token from Google Sign-In response
interface GoogleSignInResponse {
  type?: 'success' | 'cancelled';
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
    throw new Error('No ID token received from Google Sign-In. Please try again.');
  }

  return idToken;
}

// Get Google OAuth Web Client ID from environment variables
const WEB_CLIENT_ID =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

if (!WEB_CLIENT_ID) {
  console.warn('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not defined. Google login will not work.');
}

// Get Facebook OAuth configuration from environment variables
const FACEBOOK_APP_ID =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_FACEBOOK_APP_ID ||
  process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;

if (!FACEBOOK_APP_ID) {
  console.warn('EXPO_PUBLIC_FACEBOOK_APP_ID is not defined. Facebook login will not work.');
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
  if (!WEB_CLIENT_ID) {
    throw new Error(
      'Google Sign-In is not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file.'
    );
  }

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
      throw new Error('SIGN_IN_CANCELLED');
    } else if (googleError.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign-in already in progress');
    } else if (googleError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available');
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
    console.error('Error signing out from Google:', error);
  }
};

/**
 * Check if user is already signed in to Google
 */
export const isSignedIn = async (): Promise<boolean> => {
  return await GoogleSignin.isSignedIn();
};

/**
 * Initialize Facebook SDK
 * Must be called before using any Facebook Login features
 */
export const initializeFacebookSDK = (): void => {
  if (FACEBOOK_APP_ID) {
    Settings.setAppID(FACEBOOK_APP_ID);
    Settings.initializeSDK();
  }
};

/**
 * Sign in with Facebook and get access token
 * @returns Facebook access token to send to backend
 * @throws Error if sign-in fails or user cancels
 */
export const signInWithFacebook = async (): Promise<string> => {
  try {
    if (!FACEBOOK_APP_ID) {
      throw new Error(
        'Facebook App ID not configured. Please set EXPO_PUBLIC_FACEBOOK_APP_ID in your .env file.'
      );
    }

    // Request Facebook login with public_profile and email permissions
    const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

    if (result.isCancelled) {
      throw new Error('SIGN_IN_CANCELLED');
    }

    // Get access token based on platform
    let accessToken: string | null = null;

    if (Platform.OS === 'ios') {
      // iOS: Try to get AuthenticationToken (Limited Login)
      // Note: Limited Login tokens cannot be used with Graph API
      // So we also try to get the regular AccessToken
      const authToken = await AuthenticationToken.getAuthenticationTokenIOS();
      const accessTokenData = await AccessToken.getCurrentAccessToken();

      // Prefer AccessToken for backend verification
      accessToken = accessTokenData?.accessToken || null;

      if (__DEV__) {
        console.log('[OAuth] Facebook iOS tokens:', {
          hasAuthToken: !!authToken,
          hasAccessToken: !!accessToken,
        });
      }
    } else {
      // Android: Get AccessToken (standard flow)
      const accessTokenData = await AccessToken.getCurrentAccessToken();
      accessToken = accessTokenData?.accessToken || null;
    }

    if (!accessToken) {
      throw new Error('No access token received from Facebook Login. Please try again.');
    }

    console.log('[OAuth] Facebook access token received successfully');

    return accessToken;
  } catch (error: unknown) {
    const fbError = error as { message?: string };

    // Handle cancellation
    if (fbError.message === 'SIGN_IN_CANCELLED') {
      throw new Error('SIGN_IN_CANCELLED');
    }

    // Log detailed error for debugging
    if (__DEV__) {
      console.error('[OAuth] Facebook Sign-In failed:', {
        errorMessage: fbError.message,
        errorType: error?.constructor?.name,
        fullError: error,
      });
    } else {
      console.error('[OAuth] Facebook Sign-In failed:', {
        errorMessage: fbError.message,
      });
    }

    throw error;
  }
};

/**
 * Sign out from Facebook (optional, for complete logout)
 */
export const signOutFacebook = async (): Promise<void> => {
  try {
    await LoginManager.logOut();
    console.log('[OAuth] Facebook sign-out successful');
  } catch (error) {
    console.error('Error signing out from Facebook:', error);
  }
};

/**
 * Check if user is already signed in to Facebook
 */
export const isSignedInFacebook = async (): Promise<boolean> => {
  const accessToken = await AccessToken.getCurrentAccessToken();
  return accessToken !== null;
};
