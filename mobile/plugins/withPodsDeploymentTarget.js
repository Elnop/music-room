const { withPodfile } = require('@expo/config-plugins');

// The app's own target (Podfile: `platform :ios, ... || '15.1'`). Xcode 27 refuses anything
// below 15.0, and some pods still ship resource bundles that ask for iOS 9 to 13.
const DEPLOYMENT_TARGET = '15.1';
const MARKER = '# Pods deployment target raised by withPodsDeploymentTarget';

/** Raises every pod target still below the app's iOS version, after react_native_post_install. */
function withPodsDeploymentTarget(config) {
	return withPodfile(config, config => {
		const contents = config.modResults.contents;
		if (contents.includes(MARKER)) return config;
		config.modResults.contents = contents.replace(
			/(react_native_post_install\([\s\S]*?\n\s*\))/,
			`$1
    ${MARKER}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build|
        current = build.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || Gem::Version.new(current) < Gem::Version.new('${DEPLOYMENT_TARGET}')
          build.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${DEPLOYMENT_TARGET}'
        end
      end
    end`
		);
		return config;
	});
}

module.exports = withPodsDeploymentTarget;
