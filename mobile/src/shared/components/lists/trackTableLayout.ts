import { StyleSheet } from 'react-native';

export const trackTableColumns = StyleSheet.create({
	position: { width: 40, alignItems: 'center', justifyContent: 'center' },
	title: { flex: 3, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
	artist: { flex: 2, minWidth: 0, paddingHorizontal: 12 },
	duration: { width: 56, alignItems: 'flex-end' },
	trailing: { width: 80 },
});
