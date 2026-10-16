import * as Haptics from 'expo-haptics';

// Fire-and-forget: a device without a vibrator rejects, and that must stay silent.
const ignore = () => {};

/** Light impact: play/pause, next/previous, mini-player swipes. */
export function hapticTap(): void {
	Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(ignore);
}

/** Selection tick: reorder pick-up and drop. */
export function hapticSelection(): void {
	Haptics.selectionAsync().catch(ignore);
}

/** Success notification: track added to the queue, playback transferred. */
export function hapticSuccess(): void {
	Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore);
}
