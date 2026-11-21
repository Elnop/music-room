import * as Haptics from 'expo-haptics';

function ignore() {}

export function hapticTap(): void {
	Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(ignore);
}

export function hapticSelection(): void {
	Haptics.selectionAsync().catch(ignore);
}

export function hapticSuccess(): void {
	Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore);
}
