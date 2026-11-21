import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'zumik.backendUrl';

export const backendUrlStorage = {
	async load(): Promise<string | null> {
		return AsyncStorage.getItem(STORAGE_KEY);
	},

	async save(url: string): Promise<void> {
		await AsyncStorage.setItem(STORAGE_KEY, url);
	},

	async clear(): Promise<void> {
		await AsyncStorage.removeItem(STORAGE_KEY);
	},
};
