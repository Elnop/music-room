const { withProjectBuildGradle } = require('@expo/config-plugins');

const MEDIA3_VERSION = '1.8.0';
const MARKER = 'expoMediaControlMedia3Version';

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
