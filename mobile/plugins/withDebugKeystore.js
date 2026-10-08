const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Replace the Expo template's android/app/debug.keystore with the project's own.
 *
 * The template keystore is shared by every Expo app, so its SHA-1 can already be
 * registered for com.zumik.app in another Google Cloud project, which makes Google
 * Sign-In fail with DEVELOPER_ERROR. Keeping the template's alias and passwords
 * (androiddebugkey / android) lets the generated signingConfigs.debug use it unchanged,
 * for debug and release builds alike.
 *
 * SHA-1: 5D:26:8F:52:F7:A8:2D:71:3A:D9:68:BF:60:6A:79:BB:85:AA:71:C0
 */
function withDebugKeystore(config) {
	return withDangerousMod(config, [
		'android',
		async (config) => {
			const source = path.join(config.modRequest.projectRoot, 'keystores', 'debug.keystore');
			const target = path.join(config.modRequest.platformProjectRoot, 'app', 'debug.keystore');
			fs.copyFileSync(source, target);
			return config;
		},
	]);
}

module.exports = withDebugKeystore;
