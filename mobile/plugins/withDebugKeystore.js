const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

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
