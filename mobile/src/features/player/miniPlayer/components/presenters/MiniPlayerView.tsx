import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/shared/theme/ThemeContext';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Artwork } from '@/shared/components/media/Artwork';
import { EqualizerBars } from '@/shared/components/media/EqualizerBars';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { KeyButton } from '@/shared/components/ui/KeyButton';
import type { MiniPlayerData } from '@/features/player/miniPlayer/hooks/useMiniPlayer';
import { createStyles } from './miniPlayerStyles';
import { Text } from '@/shared/components/ui/Text';

interface MiniPlayerViewProps {
	data: MiniPlayerData;
}

export function MiniPlayerView({ data }: MiniPlayerViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

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
	} = data;

	const remoteLine = deviceLabel ? (
		<View style={styles.deviceRow}>
			<PixelIcon name="phone" size={12} color={theme.colors.info} />
			<Text style={styles.device} numberOfLines={1}>
				Sur {deviceLabel}
			</Text>
			<EqualizerBars color={theme.colors.info} bars={3} height={12} playing={isPlaying} />
		</View>
	) : null;

	return (
		<Pressable
			style={styles.container}
			onPress={onToggleModal}
			accessible={false}
			accessibilityRole="none"
			accessibilityLabel="Mini-lecteur"
		>
			<View style={styles.progressBarContainer}>
				<View style={[styles.progressBar, { width: `${progress}%` }]} />
			</View>
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
									<PixelIcon name="note" color={theme.colors.textSecondary} />
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

				<KeyButton
					icon={isPlaying ? 'pause' : 'play'}
					tone={track ? 'primary' : 'surface'}
					size={42}
					onPress={onTogglePlay}
					disabled={playDisabled}
					loading={isLoading}
					accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}
				/>

				<Pressable
					style={[styles.nextButton, nextDisabled && styles.disabledIcon]}
					onPress={onNext}
					hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
					disabled={nextDisabled}
					accessibilityRole="button"
					accessibilityLabel="Piste suivante"
					accessibilityState={{ disabled: nextDisabled }}
				>
					<PixelIcon name="next" color={theme.colors.text} />
				</Pressable>
			</View>
		</Pressable>
	);
}
