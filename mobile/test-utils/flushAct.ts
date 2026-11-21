import { act } from '@testing-library/react-native';

export async function flushAct(): Promise<void> {
	await act(async () => {
		await Promise.resolve();
		await Promise.resolve();
	});
}
