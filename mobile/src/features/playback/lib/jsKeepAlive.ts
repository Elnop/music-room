import { AppRegistry, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

const TASK_KEY = 'JsKeepAlive';

interface JsKeepAliveModule {
	start(): void;
	stop(): void;
}

const native =
	Platform.OS === 'android' ? requireOptionalNativeModule<JsKeepAliveModule>('JsKeepAlive') : null;

export function registerJsKeepAliveTask(): void {
	AppRegistry.registerHeadlessTask(TASK_KEY, () => () => new Promise<void>(() => undefined));
}

export const jsKeepAlive = {
	start: () => native?.start(),
	stop: () => native?.stop(),
};
