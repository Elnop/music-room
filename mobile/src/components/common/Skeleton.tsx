import React, { useEffect, useMemo, useState } from 'react';
import {
	AccessibilityInfo,
	Animated,
	Dimensions,
	Easing,
	StyleSheet,
	View,
	type DimensionValue,
	type StyleProp,
	type ViewStyle,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';

/**
 * Whether the OS asks to reduce motion; follows the setting while mounted.
 * `null` until the first answer, so nothing moves before it is known.
 */
function useReduceMotion(): boolean | null {
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

interface SkeletonBlockProps {
	width?: DimensionValue;
	height?: DimensionValue;
	radius?: number;
	style?: StyleProp<ViewStyle>;
}

/** A placeholder shape that pulses, or stays still when reduce motion is on (#317). */
export function SkeletonBlock({
	width = '100%',
	height = 16,
	radius = 4,
	style,
}: SkeletonBlockProps) {
	const { theme } = useTheme();
	const reduceMotion = useReduceMotion();
	const opacity = useMemo(() => new Animated.Value(1), []);

	useEffect(() => {
		if (reduceMotion !== false) {
			opacity.setValue(1);
			return undefined;
		}
		const pulse = Animated.loop(
			Animated.sequence([
				Animated.timing(opacity, {
					toValue: 0.4,
					duration: 800,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: true,
				}),
				Animated.timing(opacity, {
					toValue: 1,
					duration: 800,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: true,
				}),
			])
		);
		pulse.start();
		return () => pulse.stop();
	}, [reduceMotion, opacity]);

	return (
		<Animated.View
			testID="skeleton-block"
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={[
				{
					width,
					height,
					borderRadius: radius,
					backgroundColor: theme.colors.surfaceAlt,
					opacity,
				},
				style,
			]}
		/>
	);
}

/** Same shape as a TrackItem row: 48px artwork, title and artist lines. */
export function TrackRowSkeleton() {
	const { theme } = useTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);
	return (
		<View style={styles.row}>
			<SkeletonBlock width={48} height={48} radius={4} />
			<View style={styles.rowInfo}>
				<SkeletonBlock width="70%" height={14} />
				<SkeletonBlock width="45%" height={12} style={styles.secondLine} />
			</View>
		</View>
	);
}

/** Same shape as a user row: round avatar, name and subtitle lines. */
export function UserRowSkeleton() {
	const { theme } = useTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);
	return (
		<View style={styles.row}>
			<SkeletonBlock width={48} height={48} radius={24} />
			<View style={styles.rowInfo}>
				<SkeletonBlock width="55%" height={14} />
				<SkeletonBlock width="35%" height={12} style={styles.secondLine} />
			</View>
		</View>
	);
}

// Same width as PlaylistGridCard, so the grid does not jump when cards arrive.
const GRID_CARD_WIDTH = (Dimensions.get('window').width - 48 - 8) / 2;

interface PlaylistCardSkeletonProps {
	width?: number;
}

/** Same shape as a playlist card: square cover, name and owner lines. */
export function PlaylistCardSkeleton({ width = GRID_CARD_WIDTH }: PlaylistCardSkeletonProps) {
	const { theme } = useTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);
	return (
		<View style={{ width }}>
			<SkeletonBlock width={width} height={width} radius={8} />
			<SkeletonBlock width="80%" height={14} style={styles.cardTitle} />
			<SkeletonBlock width="50%" height={12} style={styles.secondLine} />
		</View>
	);
}

interface SkeletonListProps {
	/** How many placeholder rows to show. */
	count?: number;
	/** The placeholder drawn for each row. */
	row: React.ComponentType;
	/** Placeholder drawn above the rows, inside the same announcement. */
	header?: React.ReactNode;
	style?: StyleProp<ViewStyle>;
}

/**
 * Placeholder rows shown on a first load instead of a spinner. Screen readers
 * hear « Chargement » once for the whole list, never each block.
 */
export function SkeletonList({ count = 6, row: Row, header, style }: SkeletonListProps) {
	return (
		<View
			testID="skeleton-list"
			accessible
			accessibilityRole="progressbar"
			accessibilityLabel="Chargement"
			accessibilityState={{ busy: true }}
			style={style}
		>
			{header}
			{Array.from({ length: count }, (_, index) => (
				<Row key={index} />
			))}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: 8,
			paddingHorizontal: theme.spacing.md,
		},
		rowInfo: {
			flex: 1,
			marginLeft: theme.spacing.md,
		},
		secondLine: {
			marginTop: 6,
		},
		cardTitle: {
			marginTop: theme.spacing.sm,
		},
	});
