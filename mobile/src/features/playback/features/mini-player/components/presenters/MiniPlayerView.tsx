import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Artwork } from '@/shared/theme/components/Artwork';
import { EqualizerBars } from '@/shared/theme/components/EqualizerBars';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { KeyButton } from '@/shared/theme/components/KeyButton';
import type { MiniPlayerData } from '@/features/playback/features/mini-player/useMiniPlayer';
import { createStyles } from '@/features/playback/features/mini-player/components/presenters/miniPlayerStyles';
import { Text } from '@/shared/theme/components/Text';
import ArrowRightSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/arrow-right-solid.svg';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';
import PauseSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pause-solid.svg';
import PhoneRingingLowSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/phone-ringing-low-solid.svg';
import PlaySolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/play-solid.svg';

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
			<PixelIcon icon={PhoneRingingLowSolid} size={12} color={theme.colors.info} />
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
									<PixelIcon icon={MusicSolid} color={theme.colors.textSecondary} />
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
					icon={isPlaying ? PauseSolid : PlaySolid}
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
					<PixelIcon icon={ArrowRightSolid} color={theme.colors.text} />
				</Pressable>
			</View>
		</Pressable>
	);
}
