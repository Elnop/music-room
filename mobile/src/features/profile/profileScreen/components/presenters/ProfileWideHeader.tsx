import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
	WideProfileHeader,
	wideProfileActionStyle,
} from '@/shared/components/profile/WideProfileHeader';
import { Button } from '@/shared/components/ui/Button';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { UserProfile } from '@/types/user.types';
import type { UserStats } from '@/features/profile/types';

interface ProfileWideHeaderProps {
	user: UserProfile;
	stats?: UserStats | null;
	onEditProfile: () => void;
	onSettings: () => void;
}

export function ProfileWideHeader({
	user,
	stats,
	onEditProfile,
	onSettings,
}: ProfileWideHeaderProps) {
	const { theme } = useTheme();
	const actionStyle = React.useMemo(() => wideProfileActionStyle(theme), [theme]);

	return (
		<WideProfileHeader
			kind="Mon profil"
			name={user.displayName || user.username}
			username={user.username}
			avatarUrl={user.avatarUrl}
			bio={user.bio}
			followersCount={stats?.followersCount ?? 0}
			followingCount={stats?.followingCount ?? 0}
			actions={
				<>
					<Button
						variant="secondary"
						onPress={onEditProfile}
						style={actionStyle}
						icon={<Ionicons name="create-outline" size={18} color={theme.colors.text} />}
					>
						Modifier le profil
					</Button>
					<Button
						variant="secondary"
						onPress={onSettings}
						style={actionStyle}
						icon={<Ionicons name="settings-outline" size={18} color={theme.colors.text} />}
					>
						Réglages
					</Button>
				</>
			}
		/>
	);
}
