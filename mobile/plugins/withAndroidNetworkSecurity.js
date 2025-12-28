const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Extract hostname from URL
 * Examples:
 *   - https://zumik.cluzhub.com → zumik.cluzhub.com
 *   - http://192.168.1.25:3000 → 192.168.1.25
 *   - http://localhost:3000 → localhost
 */
function extractHostname(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    console.warn('[withAndroidNetworkSecurity] Invalid URL:', url);
    return null;
  }
}

/**
 * Read EXPO_PUBLIC_API_URL from .env file
 */
function getApiUrlFromEnv(projectRoot) {
  // During expo prebuild, projectRoot is the parent of "android" folder
  // We need to look in the "mobile" directory, which is projectRoot itself
  const envPath = path.join(projectRoot, '.env');

  console.log(`[withAndroidNetworkSecurity] Looking for .env at: ${envPath}`);

  // Try process.env first (available during expo prebuild)
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log(
      `[withAndroidNetworkSecurity] Found in process.env: ${process.env.EXPO_PUBLIC_API_URL}`
    );
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Fallback: read from .env file
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^EXPO_PUBLIC_API_URL=(.*)$/m);
    if (match) {
      const url = match[1].trim();
      console.log(`[withAndroidNetworkSecurity] Found in .env file: ${url}`);
      return url;
    }
  }

  console.warn(`[withAndroidNetworkSecurity] .env file not found at: ${envPath}`);
  return null;
}

/**
 * Expo Config Plugin to add network security configuration for cleartext traffic
 * This allows HTTP connections in production builds (for local development)
 * Dynamically reads backend URL from .env and adds it to the allowed domains list
 */
module.exports = function withAndroidNetworkSecurity(config) {
  // Step 1: Modify AndroidManifest.xml
  config = withAndroidManifest(config, config => {
    const manifest = config.modResults;
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

    // Add usesCleartextTraffic attribute
    mainApplication.$['android:usesCleartextTraffic'] = 'true';

    // Add networkSecurityConfig attribute
    mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    console.log(
      '[withAndroidNetworkSecurity] Added usesCleartextTraffic and networkSecurityConfig to manifest'
    );

    return config;
  });

  // Step 2: Generate network_security_config.xml dynamically
  config = withDangerousMod(config, [
    'android',
    async config => {
      const projectRoot = config.modRequest.projectRoot;
      const androidResXmlPath = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'xml'
      );

      // Create res/xml directory if it doesn't exist
      if (!fs.existsSync(androidResXmlPath)) {
        fs.mkdirSync(androidResXmlPath, { recursive: true });
        console.log('[withAndroidNetworkSecurity] Created res/xml directory');
      }

      // Get API URL from environment
      const apiUrl = getApiUrlFromEnv(projectRoot);
      const hostname = apiUrl ? extractHostname(apiUrl) : null;

      // Build domain list
      const domains = [
        'localhost', // Development: localhost
        '10.0.2.2', // Development: Android emulator
      ];

      // Add backend hostname if found
      if (hostname && hostname !== 'localhost' && hostname !== '10.0.2.2') {
        domains.push(hostname);
        console.log(`[withAndroidNetworkSecurity] Added backend domain: ${hostname}`);
      } else {
        console.warn('[withAndroidNetworkSecurity] No backend URL found, using defaults only');
      }

      // Generate domain XML entries
      const domainEntries = domains
        .map(domain => `        <domain includeSubdomains="true">${domain}</domain>`)
        .join('\n');

      // Write network_security_config.xml
      const networkSecurityConfigContent = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow cleartext traffic for local development -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <!-- Dynamically configured domains -->
    <domain-config cleartextTrafficPermitted="true">
${domainEntries}
    </domain-config>
</network-security-config>`;

      const configPath = path.join(androidResXmlPath, 'network_security_config.xml');
      fs.writeFileSync(configPath, networkSecurityConfigContent);
      console.log('[withAndroidNetworkSecurity] Created network_security_config.xml');
      console.log('[withAndroidNetworkSecurity] Allowed domains:', domains);

      return config;
    },
  ]);

  return config;
};
