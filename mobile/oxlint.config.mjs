import { reactNativeConfig } from '@brutalway/oxlint-config-react-native';
import { colorFiles } from '@brutalway/oxlint-config-react-native/colorFiles';
import { designSystemPrimitives } from '@brutalway/oxlint-config-react-native/designSystemPrimitives';
import { tanstackQueryConfig } from '@brutalway/oxlint-config-tanstack-query';
import { reactHookFormConfig } from '@brutalway/oxlint-config-react-hook-form';
import { defineConfig } from 'oxlint';

export default defineConfig({
	extends: [
		reactNativeConfig,
		tanstackQueryConfig,
		reactHookFormConfig,
		designSystemPrimitives({
			components: ['Pressable', 'TouchableOpacity', 'Text', 'TextInput'],
			files: ['src/shared/theme/**'],
		}),
		colorFiles(['src/shared/image-colors/**']),
	],
});
