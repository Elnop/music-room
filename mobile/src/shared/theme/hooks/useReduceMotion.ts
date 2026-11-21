import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduceMotion(): boolean | null {
	const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

	useEffect(() => {
		let mounted = true;
		AccessibilityInfo.isReduceMotionEnabled()
			.then(enabled => {
				if (mounted) setReduceMotion(enabled);
			})
			.catch(() => {});
		const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', enabled => {
			setReduceMotion(enabled);
		});
		return () => {
			mounted = false;
			subscription?.remove();
		};
	}, []);

	return reduceMotion;
}
