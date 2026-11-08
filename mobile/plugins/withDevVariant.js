const { withAppBuildGradle, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const APP_ID_SUFFIX = '.dev';
const APP_NAME = 'Zumik Dev';
const DEBUG_BLOCK = /(buildTypes\s*\{\s*debug\s*\{)/;

function withDevApplicationId(config) {
	return withAppBuildGradle(config, config => {
		const contents = config.modResults.contents;
		if (config.modResults.language !== 'groovy' || contents.includes('applicationIdSuffix')) {
			return config;
		}
		if (!DEBUG_BLOCK.test(contents)) {
			throw new Error('withDevVariant: no debug buildType found in android/app/build.gradle');
		}
		config.modResults.contents = contents.replace(
			DEBUG_BLOCK,
			`$1\n            applicationIdSuffix "${APP_ID_SUFFIX}"`,
		);
		return config;
	});
}

function withDevAppName(config) {
	return withDangerousMod(config, [
		'android',
		async config => {
			const dir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'debug', 'res', 'values');
			fs.mkdirSync(dir, { recursive: true });
			fs.writeFileSync(
				path.join(dir, 'strings.xml'),
				`<resources>\n  <string name="app_name">${APP_NAME}</string>\n</resources>\n`,
			);
			return config;
		},
	]);
}

function withDevVariant(config) {
	return withDevAppName(withDevApplicationId(config));
}

module.exports = withDevVariant;
