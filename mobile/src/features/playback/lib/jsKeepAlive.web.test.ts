import { AppRegistry } from 'react-native';
import { jsKeepAlive, registerJsKeepAliveTask } from '@/features/playback/lib/jsKeepAlive.web';

describe('jsKeepAlive (web)', () => {
	it('registers no headless task, which react-native-web does not have', () => {
		const register = jest.spyOn(AppRegistry, 'registerHeadlessTask');
		registerJsKeepAliveTask();
		jsKeepAlive.start();
		jsKeepAlive.stop();
		expect(register).not.toHaveBeenCalled();
	});
});
