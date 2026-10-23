import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { FriendsStackParamList } from '@/features/friends/types';
import { useUserProfileScreen } from '@/features/friends/userProfile/hooks/useUserProfileScreen';
import { UserProfileView } from '@/features/friends/userProfile/presenters/UserProfileView';
import { createUserProfileStyles } from '@/features/friends/userProfile/presenters/userProfileStyles';

type UserProfileOrchestratorProps = Partial<
	NativeStackScreenProps<FriendsStackParamList, 'UserProfile'>
> & {
	userId?: string;
	onNavigateToPlaylist?: (playlistId: string) => void;
};

export function UserProfileOrchestrator({
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
