const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// The Expo template keystore's SHA-1 may be registered in another Google Cloud project (Google Sign-In
// DEVELOPER_ERROR). Same alias/passwords as the template. SHA-1: 5D:26:8F:52:F7:A8:2D:71:3A:D9:68:BF:60:6A:79:BB:85:AA:71:C0
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
