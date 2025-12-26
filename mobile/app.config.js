module.exports = {
  expo: {
    name: 'Music Room',
    slug: 'music-room',
    scheme: 'musicroom',
    owner: '@anonymous',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#121212',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.musicroom.app',
      associatedDomains: ['applinks:musicroom.app'],
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#121212',
      },
      package: 'com.musicroom.app',
      permissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.ACCESS_NETWORK_STATE',
      ],
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'musicroom',
              host: 'auth',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-secure-store',
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 34,
            buildToolsVersion: '35.0.0',
          },
        },
      ],
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme:
            process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ||
            'com.googleusercontent.apps.187081511514-8dc2itp857pu6qtk3bkg7l389n5bhs98',
        },
      ],
      [
        'react-native-fbsdk-next',
        {
          appID: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '335709326982644',
          clientToken:
            process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN || 'e7df3370baef0cac5ac750531fc3bcca',
          displayName: 'Music Room',
          scheme: `fb${process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '335709326982644'}`,
          advertiserIDCollectionEnabled: false,
          autoLogAppEventsEnabled: false,
          isAutoInitEnabled: true,
          iosUserTrackingPermission:
            'This identifier will be used to deliver personalized music recommendations.',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'your-project-id-here',
      },
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME,
      EXPO_PUBLIC_FACEBOOK_APP_ID: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
      EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN: process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN,
    },
  },
};
