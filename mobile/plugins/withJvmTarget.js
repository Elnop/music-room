const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Custom Expo Config Plugin to fix JVM target compatibility issues
 * Ensures all Java and Kotlin tasks use JVM target 17
 */
function withJvmTarget(config) {
  // Modify root build.gradle
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;

      // Add configuration after allprojects block
      const allProjectsRegex = /(allprojects\s*\{[^}]*\})/s;

      if (!contents.includes('jvmToolchain(17)')) {
        const jvmConfig = `
allprojects {
  repositories {
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
  }

  // Fix JVM target compatibility for all subprojects
  afterEvaluate { project ->
    // Configure Kotlin JVM toolchain
    if (project.plugins.hasPlugin('org.jetbrains.kotlin.android')) {
      project.kotlin {
        jvmToolchain(17)
      }
    }

    // Configure Java compile options
    if (project.hasProperty("android")) {
      project.android {
        compileOptions {
          sourceCompatibility JavaVersion.VERSION_17
          targetCompatibility JavaVersion.VERSION_17
        }
      }
    }

    // Explicit Kotlin JVM target
    project.tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
      it.kotlinOptions {
        jvmTarget = "17"
      }
    }
  }
}`;

        // Replace the existing allprojects block
        contents = contents.replace(allProjectsRegex, jvmConfig);
      }

      config.modResults.contents = contents;
    }
    return config;
  });

  // Modify app/build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;

      // Add compileOptions and kotlinOptions to android block if not present
      const androidBlockRegex = /(android\s*\{)/;

      if (!contents.includes('jvmTarget = \'17\'')) {
        const jvmAppConfig = `$1
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = '17'
    }
`;

        contents = contents.replace(androidBlockRegex, jvmAppConfig);
      }

      config.modResults.contents = contents;
    }
    return config;
  });

  return config;
}

module.exports = withJvmTarget;
