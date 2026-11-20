import { reactNativeConfig } from '@brutalway/oxlint-config-react-native';
import { tanstackQueryConfig } from '@brutalway/oxlint-config-tanstack-query';
import { reactHookFormConfig } from '@brutalway/oxlint-config-react-hook-form';
import { defineConfig } from 'oxlint';

export default defineConfig({
	extends: [reactNativeConfig, tanstackQueryConfig, reactHookFormConfig],
});
