import { PermissionsAndroid, Platform } from 'react-native';

export async function requestScanPermission(): Promise<boolean> {
	const wanted =
		Number(Platform.Version) >= 31
			? [
					PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
					PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
				]
			: [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
	const results = await PermissionsAndroid.requestMultiple(wanted);
	return wanted.every((permission) => results[permission] === PermissionsAndroid.RESULTS.GRANTED);
}

export async function hasScanPermission(): Promise<boolean> {
	const checks = [PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)];
	if (Number(Platform.Version) >= 31) {
		checks.push(PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN));
	}
	return (await Promise.all(checks)).every(Boolean);
}
