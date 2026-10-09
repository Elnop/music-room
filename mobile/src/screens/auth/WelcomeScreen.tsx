import React, { useEffect, useMemo, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Image,
	Animated,
	Easing,
	Dimensions,
	TouchableOpacity,
	KeyboardAvoidingView,
	ScrollView,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { Button } from '@components/common/Button';
import { BackendUrlField } from '@components/common/BackendUrlField';
import logo from '@/assets/logo/logo.png';
import appIcon from '@/assets/logo/app-icon.png';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type AuthStackParamList = {
	Welcome: undefined;
	Login: undefined;
	Register: undefined;
};

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

interface WelcomeScreenProps {
	navigation: WelcomeScreenNavigationProp;
}

interface FloatingIconProps {
	size: number;
	top: number;
	left: number;
	delay: number;
	duration: number;
	rotateDirection: 1 | -1;
	floatRange?: number;
}

function FloatingIcon({
	size,
	top,
	left,
	delay,
	duration,
	rotateDirection,
	floatRange = 25,
}: FloatingIconProps) {
	const floatAnim = useMemo(() => new Animated.Value(0), []);
	const rotateAnim = useMemo(() => new Animated.Value(0), []);
	const scaleAnim = useMemo(() => new Animated.Value(1), []);

	useEffect(() => {
		// Float animation (up and down) - more pronounced
		Animated.loop(
			Animated.sequence([
				Animated.timing(floatAnim, {
					toValue: 1,
					duration: duration,
					delay: delay,
					easing: Easing.inOut(Easing.sin),
					useNativeDriver: true,
				}),
				Animated.timing(floatAnim, {
					toValue: 0,
					duration: duration,
					easing: Easing.inOut(Easing.sin),
					useNativeDriver: true,
				}),
			])
		).start();

		// Rotate animation - plus rapide
		Animated.loop(
			Animated.timing(rotateAnim, {
				toValue: 1,
				duration: duration * 2.5,
				easing: Easing.linear,
				useNativeDriver: true,
			})
		).start();

		// Scale pulsation
		Animated.loop(
			Animated.sequence([
				Animated.timing(scaleAnim, {
					toValue: 1.15,
					duration: duration * 1.5,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: true,
				}),
				Animated.timing(scaleAnim, {
					toValue: 1,
					duration: duration * 1.5,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: true,
				}),
			])
		).start();
	}, [floatAnim, rotateAnim, scaleAnim, delay, duration]);

	const translateY = floatAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, -floatRange],
	});

	const rotate = rotateAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', `${rotateDirection * 360}deg`],
	});

	return (
		<Animated.Image
			source={appIcon}
			style={{
				position: 'absolute',
				width: size,
				height: size,
				top,
				left,
				opacity: 0.4,
				transform: [{ translateY }, { rotate }, { scale: scaleAnim }],
			}}
			resizeMode="contain"
		/>
	);
}

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const [showServer, setShowServer] = useState(false);

	return (
		<SafeAreaView style={styles.container}>
			{/* Floating background icons - plus visibles et dynamiques */}
			<FloatingIcon
				size={80}
				top={60}
				left={20}
				delay={0}
				duration={1200}
				rotateDirection={1}
				floatRange={35}
			/>
			<FloatingIcon
				size={65}
				top={120}
				left={SCREEN_WIDTH - 100}
				delay={400}
				duration={1400}
				rotateDirection={-1}
				floatRange={30}
			/>
			<FloatingIcon
				size={70}
				top={SCREEN_HEIGHT * 0.45}
				left={15}
				delay={200}
				duration={1100}
				rotateDirection={1}
				floatRange={40}
			/>
			<FloatingIcon
				size={75}
				top={SCREEN_HEIGHT * 0.55}
				left={SCREEN_WIDTH - 95}
				delay={600}
				duration={1300}
				rotateDirection={-1}
				floatRange={32}
			/>

			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
					<View style={styles.header}>
						<Image source={logo} style={styles.logo} resizeMode="contain" />
					</View>

					<View style={styles.buttonContainer}>
						<Button
							title="Get Started"
							onPress={() => navigation.navigate('Register')}
							variant="primary"
							fullWidth
						/>
						<Button
							title="Login"
							onPress={() => navigation.navigate('Login')}
							variant="outline"
							fullWidth
						/>
						<TouchableOpacity
							onPress={() => setShowServer(value => !value)}
							accessibilityRole="button"
							hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
						>
							<Text style={styles.serverToggle}>
								{showServer ? 'Hide server settings' : 'Server settings'}
							</Text>
						</TouchableOpacity>
						{showServer && (
							<View style={styles.serverPanel}>
								<BackendUrlField />
							</View>
						)}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		flex: {
			flex: 1,
		},
		content: {
			flexGrow: 1,
			justifyContent: 'space-between',
			padding: theme.spacing.lg,
		},
		header: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
		},
		logo: {
			width: 300,
			height: 300,
		},
		buttonContainer: {
			gap: theme.spacing.md,
			marginBottom: theme.spacing.xl,
		},
		serverToggle: {
			textAlign: 'center',
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			textDecorationLine: 'underline',
		},
		serverPanel: {
			padding: theme.spacing.md,
			backgroundColor: theme.colors.surface,
			borderRadius: 12,
			borderWidth: theme.borders.thin,
			borderColor: theme.colors.border,
		},
	});
