module.exports = {
	expo: {
		name: 'Zumik',
		slug: 'zumik',
		scheme: 'zumik',
		owner: '@anonymous',
		version: '1.0.0',
		orientation: 'portrait',
		icon: './src/assets/logo/app-icon.png',
		userInterfaceStyle: 'dark',
		// Window background before the first render (expo-system-ui), else Android shows white;
		// ThemedSystemUI then follows the active theme.
		backgroundColor: '#0D0D0D',
		newArchEnabled: true,
		splash: {
			image: './src/assets/logo/logo.png',
			resizeMode: 'contain',
			backgroundColor: '#121212',
		},
		assetBundlePatterns: ['**/*'],
		ios: {
			supportsTablet: true,
			bundleIdentifier: 'com.zumik.app',
			infoPlist: {
				UIBackgroundModes: ['audio'],
			},
		},
		android: {
			adaptiveIcon: {
				foregroundImage: './assets/adaptive-icon.png',
				backgroundColor: '#121212',
			},
			package: 'com.zumik.app',
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
							scheme: 'zumik',
							host: 'auth',
						},
						// Share links: zumik://playlist/<id>, zumik://user/<id>
						{
							scheme: 'zumik',
							host: 'playlist',
						},
						{
							scheme: 'zumik',
							host: 'user',
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
				'expo-image-picker',
				{
					photosPermission:
						'Zumik accède à vos photos pour que vous choisissiez votre photo de profil.',
					cameraPermission:
						"Zumik utilise l'appareil photo pour que vous preniez votre photo de profil.",
					microphonePermission: false,
				},
			],
			[
				'expo-location',
				{
					locationWhenInUsePermission:
						'Zumik utilise votre position pour situer vos événements et trouver ceux qui sont proches. Elle ne quitte jamais votre téléphone.',
					isAndroidBackgroundLocationEnabled: false,
					isAndroidForegroundServiceEnabled: false,
				},
			],
			'@react-native-community/datetimepicker',
			'./plugins/withDebugKeystore.js',
			'./plugins/withDevVariant.js',
			'./plugins/withMedia3Version.js',
			['expo-media-control', { enableBackgroundAudio: true, audioSessionCategory: 'playback' }],
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
					displayName: 'Zumik',
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
