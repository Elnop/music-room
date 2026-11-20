import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@zumik_device_id';

export const deviceStorage = {
	async getDeviceId(): Promise<string | null> {
		return AsyncStorage.getItem(DEVICE_ID_KEY);
	},

	async setDeviceId(id: string): Promise<void> {
		await AsyncStorage.setItem(DEVICE_ID_KEY, id);
	},

	async clearDeviceId(): Promise<void> {
		await AsyncStorage.removeItem(DEVICE_ID_KEY);
	},
};
