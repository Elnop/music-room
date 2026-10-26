import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

function pick(mode: 'date' | 'time', value: Date): Promise<Date | null> {
	return new Promise(resolve => {
		DateTimePickerAndroid.open({
			value,
			mode,
			is24Hour: true,
			onChange: (event, date) => resolve(event.type === 'set' && date ? date : null),
		});
	});
}

/** Android's picker shows the date, then the time. Null when either is dismissed. */
export async function pickDateTime(current: Date): Promise<Date | null> {
	const day = await pick('date', current);
	if (!day) return null;
	const time = await pick('time', day);
	if (!time) return null;
	const result = new Date(day);
	result.setHours(time.getHours(), time.getMinutes(), 0, 0);
	return result;
}
