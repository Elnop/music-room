import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	RefreshControl,
	Pressable,
	Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import type { Theme } from '@themes/types';
import type { MusicGenre, MusicPreferences } from '@/types/user.types';
import { useAuthStore } from '@/store/authStore';
import { privacyApi } from '@/services/privacyApi';
import { friendsApi, type MyStats } from '@/services/friendsApi';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@components/common/Avatar';
import { ProfileSection } from '@components/profile/ProfileSection';
import { GenreChip } from '@components/profile/GenreChip';
import { ThemeSelector } from '@components/theme/ThemeSelector';

type ProfileStackParamList = {
	Profile: undefined;
	EditProfile: undefined;
	Settings: undefined;
	PrivacySettings: undefined;
	LinkedAccounts: undefined;
	MyDevices: undefined;
	MusicPreferences: undefined;
};

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export function ProfileScreen() {
	const { theme } = useTheme();
	const playerHeight = usePlayerHeight();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const navigation = useNavigation<NavigationProp>();
	const { user, logout, isLoading, accessToken, isAuthenticated } = useAuthStore();

	const [musicPreferences, setMusicPreferences] = useState<MusicPreferences | null>(null);
	const [stats, setStats] = useState<MyStats | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const handleEditProfile = useCallback(() => {
		navigation.navigate('EditProfile');
	}, [navigation]);

	const handleSettings = useCallback(() => {
		navigation.navigate('Settings');
	}, [navigation]);

	// Edit-profile and settings buttons in the native header
	useLayoutEffect(() => {
		const buttonStyle = {
			width: 36,
			height: 36,
			alignItems: 'center',
			justifyContent: 'center',
		} as const;
		navigation.setOptions({
			headerRight: () => (
				<View style={{ flexDirection: 'row' }}>
					<Pressable
						onPress={handleEditProfile}
						accessibilityRole="button"
						accessibilityLabel="Modifier le profil"
						style={buttonStyle}
					>
						<Ionicons name="create-outline" size={24} color={theme.colors.text} />
					</Pressable>
					<Pressable
						onPress={handleSettings}
						accessibilityRole="button"
						accessibilityLabel="Réglages"
						style={buttonStyle}
					>
						<Ionicons name="settings-outline" size={24} color={theme.colors.text} />
					</Pressable>
				</View>
			),
		});
	}, [navigation, handleEditProfile, handleSettings, theme.colors.text]);

	// Load profile data (music preferences + stats)
	const loadProfileData = useCallback(async () => {
		if (!accessToken || !isAuthenticated) return;

		try {
			const [prefsData, statsData] = await Promise.all([
				privacyApi.getMusicPreferences(accessToken),
				friendsApi.getMyStats(accessToken),
			]);
			if (useAuthStore.getState().isAuthenticated) {
				setMusicPreferences(prefsData);
				setStats(statsData);
			}
		} catch {
			// Silently fail - data is optional and errors during logout are expected
		}
	}, [accessToken, isAuthenticated]);

	// Reload on focus
	useFocusEffect(
		useCallback(() => {
			loadProfileData();
		}, [loadProfileData])
	);

	const handleRefresh = async () => {
		setIsRefreshing(true);
		await loadProfileData();
		setIsRefreshing(false);
	};

	const handlePrivacySettings = () => {
		navigation.navigate('PrivacySettings');
	};

	const handleLinkedAccounts = () => {
		navigation.navigate('LinkedAccounts');
	};

	const handleMyDevices = () => {
		navigation.navigate('MyDevices');
	};

	const handleMusicPreferences = () => {
		navigation.navigate('MusicPreferences');
	};

	const handleLogout = async () => {
		try {
			await logout();
		} catch (error) {
			console.error('[ProfileScreen] Logout failed:', error);
		}
	};

	const confirmLogout = () => {
		Alert.alert('Se déconnecter ?', 'Vous devrez vous reconnecter pour utiliser Zumik.', [
			{ text: 'Annuler', style: 'cancel' },
			{ text: 'Se déconnecter', style: 'destructive', onPress: handleLogout },
		]);
	};

	if (!user) {
		return (
			<View style={styles.container}>
				<Text style={styles.errorText}>No user data available</Text>
			</View>
		);
	}

	const genres = musicPreferences?.genres || [];

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={[
					styles.contentContainer,
					{ paddingBottom: playerHeight + theme.spacing.xl },
				]}
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={handleRefresh}
						tintColor={theme.colors.primary}
					/>
				}
			>
				{/* Hero Section */}
				<View style={styles.heroContent}>
					<Avatar size="lg" name={user.displayName || user.username} uri={user.avatarUrl} />

					<Text style={styles.username}>@{user.username}</Text>

					{user.displayName && <Text style={styles.displayName}>{user.displayName}</Text>}

					{user.bio && <Text style={styles.bio}>{user.bio}</Text>}

					{/* Stats Row */}
					<View style={styles.statsRow}>
						<View style={styles.statItem}>
							<Text style={styles.statValue}>{stats?.followersCount ?? 0}</Text>
							<Text style={styles.statLabel}>Followers</Text>
						</View>
						<View style={styles.statDivider} />
						<View style={styles.statItem}>
							<Text style={styles.statValue}>{stats?.followingCount ?? 0}</Text>
							<Text style={styles.statLabel}>Following</Text>
						</View>
					</View>
				</View>

				{/* Music Preferences Section */}
				<ProfileSection
					title="Music preferences"
					rightAction={{
						label: 'Edit',
						onPress: handleMusicPreferences,
					}}
				>
					{genres.length > 0 ? (
						<View style={styles.genresContainer}>
							{genres.map((genre: MusicGenre) => (
								<GenreChip key={genre} genre={genre} selected size="sm" />
							))}
						</View>
					) : (
						<TouchableOpacity style={styles.emptyState} onPress={handleMusicPreferences}>
							<Ionicons
								name="musical-notes-outline"
								size={32}
								color={theme.colors.textSecondary}
								style={styles.emptyStateIcon}
							/>
							<Text style={styles.emptyStateText}>Add your favorite genres</Text>
							<Text style={styles.emptyStateHint}>Tap to select up to 5 genres</Text>
						</TouchableOpacity>
					)}
				</ProfileSection>

				{/* Profile Info Section */}
				<ProfileSection title="Information">
					<View style={styles.infoItem}>
						<Text style={styles.infoLabel}>Email</Text>
						<Text style={styles.infoValue}>{user.email}</Text>
					</View>

					<View style={styles.divider} />

					<View style={styles.infoItem}>
						<Text style={styles.infoLabel}>Username</Text>
						<Text style={styles.infoValue}>@{user.username}</Text>
					</View>

					<View style={styles.divider} />

					<View style={styles.infoItem}>
						<Text style={styles.infoLabel}>Member since</Text>
						<Text style={styles.infoValue}>
							{new Date(user.createdAt).toLocaleDateString('en-US', {
								month: 'long',
								year: 'numeric',
							})}
						</Text>
					</View>
				</ProfileSection>

				{/* Theme Section */}
				<ProfileSection title="Theme">
					<ThemeSelector />
				</ProfileSection>

				{/* Privacy Settings Button */}
				<View style={styles.privacyButtonContainer}>
					<TouchableOpacity style={styles.privacyButton} onPress={handlePrivacySettings}>
						<View style={styles.privacyIconContainer}>
							<Ionicons name="lock-closed" size={20} color={theme.colors.primary} />
						</View>
						<View style={styles.privacyTextContainer}>
							<Text style={styles.privacyTitle}>Privacy</Text>
							<Text style={styles.privacySubtitle}>Manage who can see your information</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
					</TouchableOpacity>
				</View>

				{/* Linked Accounts Button */}
				<View style={styles.privacyButtonContainer}>
					<TouchableOpacity style={styles.privacyButton} onPress={handleLinkedAccounts}>
						<View style={styles.privacyIconContainer}>
							<Ionicons name="link" size={20} color={theme.colors.primary} />
						</View>
						<View style={styles.privacyTextContainer}>
							<Text style={styles.privacyTitle}>Linked accounts</Text>
							<Text style={styles.privacySubtitle}>Add or remove Google and Facebook sign-in</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
					</TouchableOpacity>
				</View>

				{/* My Devices Button */}
				<View style={styles.privacyButtonContainer}>
					<TouchableOpacity style={styles.privacyButton} onPress={handleMyDevices}>
						<View style={styles.privacyIconContainer}>
							<Ionicons name="phone-portrait-outline" size={20} color={theme.colors.primary} />
						</View>
						<View style={styles.privacyTextContainer}>
							<Text style={styles.privacyTitle}>Mes appareils</Text>
							<Text style={styles.privacySubtitle}>
								Choisissez quels amis contrôlent chaque appareil
							</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
					</TouchableOpacity>
				</View>

				{/* Logout Button */}
				<View style={styles.logoutSection}>
					<TouchableOpacity
						style={styles.logoutButton}
						onPress={confirmLogout}
						disabled={isLoading}
					>
						<Ionicons name="log-out-outline" size={20} color="#DC2626" />
						<Text style={styles.logoutText}>Se déconnecter</Text>
					</TouchableOpacity>
				</View>

				{/* Footer */}
				<Text style={styles.footer}>Zumik v1.0.0</Text>
			</ScrollView>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		scrollView: {
			flex: 1,
		},
		contentContainer: {
			paddingBottom: theme.spacing.xl,
		},
		heroContent: {
			alignItems: 'center',
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.lg,
			paddingBottom: theme.spacing.xl,
		},
		username: {
			fontSize: 14,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.md,
		},
		displayName: {
			fontSize: 26,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.text,
			marginTop: theme.spacing.xs,
		},
		bio: {
			fontSize: 15,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.sm,
			textAlign: 'center',
			lineHeight: 22,
			maxWidth: '80%',
		},
		statsRow: {
			flexDirection: 'row',
			alignItems: 'center',
			marginTop: theme.spacing.lg,
			backgroundColor: theme.colors.surface,
			borderRadius: 16,
			paddingVertical: theme.spacing.md,
			paddingHorizontal: theme.spacing.xl,
		},
		statItem: {
			alignItems: 'center',
			paddingHorizontal: theme.spacing.lg,
		},
		statValue: {
			fontSize: 18,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.text,
		},
		statLabel: {
			fontSize: 12,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		statDivider: {
			width: 1,
			height: 30,
			backgroundColor: theme.colors.border,
		},
		genresContainer: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			gap: theme.spacing.xs,
		},
		emptyState: {
			alignItems: 'center',
			paddingVertical: theme.spacing.lg,
		},
		emptyStateIcon: {
			marginBottom: theme.spacing.sm,
			opacity: 0.6,
		},
		emptyStateText: {
			fontSize: 16,
			fontWeight: theme.typography.weights.medium,
			color: theme.colors.text,
		},
		emptyStateHint: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: 4,
		},
		infoItem: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingVertical: theme.spacing.sm,
		},
		infoLabel: {
			fontSize: 15,
			color: theme.colors.textSecondary,
		},
		infoValue: {
			fontSize: 15,
			color: theme.colors.text,
			fontWeight: theme.typography.weights.medium,
		},
		divider: {
			height: 1,
			backgroundColor: theme.colors.border,
		},
		privacyButtonContainer: {
			paddingHorizontal: theme.spacing.lg,
			marginTop: theme.spacing.md,
		},
		privacyButton: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surface,
			padding: theme.spacing.lg,
			borderRadius: 16,
		},
		privacyIconContainer: {
			width: 40,
			height: 40,
			borderRadius: 20,
			backgroundColor: theme.colors.primary + '15',
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.md,
		},
		privacyTextContainer: {
			flex: 1,
		},
		privacyTitle: {
			fontSize: 16,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.text,
		},
		privacySubtitle: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		logoutSection: {
			paddingHorizontal: theme.spacing.lg,
			marginTop: theme.spacing.lg,
		},
		logoutButton: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			gap: theme.spacing.sm,
			paddingVertical: theme.spacing.md,
			borderRadius: 12,
			borderWidth: 1,
			borderColor: '#DC2626',
			backgroundColor: 'transparent',
		},
		logoutText: {
			fontSize: 16,
			fontWeight: theme.typography.weights.semibold,
			color: '#DC2626',
		},
		footer: {
			textAlign: 'center',
			fontSize: 12,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xl,
		},
		errorText: {
			fontSize: 16,
			color: theme.colors.error,
			textAlign: 'center',
			marginTop: theme.spacing.xl,
		},
	});
