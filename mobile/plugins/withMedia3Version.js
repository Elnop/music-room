const { withProjectBuildGradle } = require('@expo/config-plugins');

// expo-audio pins Media3 1.8.0 (node_modules/expo-audio/android/build.gradle);
// expo-media-control defaults to 1.9.0 unless the root project sets this ext property.
const MEDIA3_VERSION = '1.8.0';
const MARKER = 'expoMediaControlMedia3Version';

/** One Media3 version for both modules, so they share the same MediaSession classes. */
function withMedia3Version(config) {
	return withProjectBuildGradle(config, config => {
		if (config.modResults.language !== 'groovy') return config;
		const contents = config.modResults.contents;
		if (!contents.includes(MARKER)) {
			config.modResults.contents = `${contents}
// Media3 version shared by expo-audio and expo-media-control
ext.${MARKER} = "${MEDIA3_VERSION}"
`;
		}
		return config;
	});
}

module.exports = withMedia3Version;
