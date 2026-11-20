import React, { useCallback } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LoadingSpinner } from '@/shared/theme/components/LoadingSpinner';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { FriendsStackParamList } from '@/features/user/features/friends/types';
import { useUserProfileScreen } from '@/features/user/features/friends/features/user-profile/useUserProfileScreen';
import { UserProfileView } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileView';
import { createUserProfileStyles } from '@/features/user/features/friends/features/user-profile/lib/userProfileStyles';
import { Text } from '@/shared/theme/components/Text';

type UserProfileOrchestratorProps = Partial<
	NativeStackScreenProps<FriendsStackParamList, 'UserProfile'>
> & {
	userId?: string;
	onNavigateToPlaylist?: (playlistId: string) => void;
};

export function UserProfileContainer({
	route,
	navigation,
	userId: propUserId,
	onNavigateToPlaylist,
}: UserProfileOrchestratorProps) {
	const userId = propUserId || route?.params?.userId || '';
	const { theme } = useTheme();
	const styles = React.useMemo(() => createUserProfileStyles(theme), [theme]);
	const screen = useUserProfileScreen(userId);

	const handleSelectPlaylist = useCallback(
		(playlistId: string) => {
			if (onNavigateToPlaylist) {
				onNavigateToPlaylist(playlistId);
			} else if (navigation) {
				navigation.navigate('PlaylistDetail', { id: playlistId });
			}
		},
		[navigation, onNavigateToPlaylist]
	);

	if (screen.isLoading) {
		return <LoadingSpinner fullScreen message="Chargement du profil…" />;
	}

	if (screen.error || !screen.profile) {
		return (
			<View style={styles.container}>
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>{screen.error || 'Profil introuvable'}</Text>
				</View>
			</View>
		);
	}

	return (
		<UserProfileView {...screen} profile={screen.profile} onSelectPlaylist={handleSelectPlaylist} />
	);
}
