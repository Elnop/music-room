import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/shared/theme/ThemeContext';
import { FIXED_COLORS } from '@/shared/theme/tokens';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Artwork } from '@/shared/components/media/Artwork';
import type { MiniPlayerData } from '@/features/player/miniPlayer/hooks/useMiniPlayer';
import { createStyles } from './miniPlayerStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MiniPlayerViewProps {
	data: MiniPlayerData;
}

export function MiniPlayerView({ data }: MiniPlayerViewProps) {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = React.useMemo(() => createStyles(theme, insets), [theme, insets]);

	const {
		track,
		deviceLabel,
		isPlaying,
		isLoading,
		playDisabled,
		nextDisabled,
		progress,
		openLabel,
		onToggleModal,
		onTogglePlay,
		onNext,
		infoStyle,
		onLayout,
	} = data;

	const remoteLine = deviceLabel ? (
		<Text style={styles.device} numberOfLines={1}>
			Sur {deviceLabel}
		</Text>
	) : null;

	return (
		<Pressable
			style={styles.container}
			onLayout={onLayout}
			onPress={onToggleModal}
			accessible={false}
			accessibilityLabel="Mini-lecteur"
		>
			<View style={styles.content}>
				<Animated.View style={[styles.swipeArea, infoStyle]}>
					<Pressable
						style={styles.infoButton}
						onPress={onToggleModal}
						accessibilityRole="button"
						accessibilityLabel={openLabel}
					>
						{!track ? (
							<>
								<View style={[styles.artwork, styles.emptyArtwork]}>
									<Ionicons name="musical-notes" size={20} color={theme.colors.textSecondary} />
								</View>
								<View style={styles.info}>
									<Text style={styles.title} numberOfLines={1}>
										Rien en lecture
									</Text>
									<Text style={styles.artist} numberOfLines={1}>
										Choisissez un titre pour commencer
									</Text>
									{remoteLine}
								</View>
							</>
						) : (
							<>
								<Artwork uri={track.artworkUrl} size={40} style={styles.artwork} iconSize={20} />
								<View style={styles.info}>
									<Text style={styles.title} numberOfLines={1}>
										{track.title}
									</Text>
									<Text style={styles.artist} numberOfLines={1}>
										{track.artist}
									</Text>
									{remoteLine}
								</View>
							</>
						)}
					</Pressable>
				</Animated.View>

				<Pressable
					style={[styles.playButton, !track && styles.playButtonEmpty]}
					onPress={onTogglePlay}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					disabled={playDisabled}
					accessibilityRole="button"
					accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}
					accessibilityState={{ disabled: playDisabled, busy: isLoading }}
				>
					{isLoading ? (
						<ActivityIndicator size="small" color={FIXED_COLORS.onColor} />
					) : (
						<Ionicons
							name={isPlaying ? 'pause' : 'play'}
							size={20}
							color={track ? FIXED_COLORS.onColor : theme.colors.textSecondary}
							style={isPlaying ? undefined : { marginLeft: 2 }}
						/>
					)}
				</Pressable>

				<Pressable
					style={styles.nextButton}
					onPress={onNext}
					hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
					disabled={nextDisabled}
					accessibilityRole="button"
					accessibilityLabel="Piste suivante"
					accessibilityState={{ disabled: nextDisabled }}
				>
					<Ionicons
						name="play-skip-forward"
						size={22}
						color={theme.colors.text}
						style={nextDisabled ? styles.disabledIcon : undefined}
					/>
				</Pressable>
			</View>

			<View style={styles.progressBarContainer}>
				<View style={[styles.progressBar, { width: `${progress}%` }]} />
			</View>
		</Pressable>
	);
}
