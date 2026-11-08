import { AppRegistry, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

// Android pauses JS timers in the background, and fetch resolves through setTimeout:
// a running headless task keeps them going (local module mobile/modules/js-keep-alive).
const TASK_KEY = 'JsKeepAlive';

interface JsKeepAliveModule {
	start(): void;
	stop(): void;
}

const native =
	Platform.OS === 'android' ? requireOptionalNativeModule<JsKeepAliveModule>('JsKeepAlive') : null;

/** The task does nothing and never ends on its own: the native side finishes it. */
export function registerJsKeepAliveTask(): void {
	AppRegistry.registerHeadlessTask(TASK_KEY, () => () => new Promise<void>(() => undefined));
}

export const jsKeepAlive = {
	start: () => native?.start(),
	stop: () => native?.stop(),
};
