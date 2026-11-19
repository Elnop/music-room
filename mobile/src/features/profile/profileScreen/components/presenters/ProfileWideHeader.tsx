import React from 'react';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import {
	WideProfileHeader,
	wideProfileActionStyle,
} from '@/shared/components/profile/WideProfileHeader';
import { Button } from '@/shared/components/ui/Button';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { UserProfile } from '@/types/user.types';
import type { UserStats } from '@/features/profile/types';
import CogSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/cog-solid.svg';
import PencilSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pencil-solid.svg';

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
						icon={<PixelIcon icon={PencilSolid} size={18} color={theme.colors.text} />}
					>
						Modifier le profil
					</Button>
					<Button
						variant="secondary"
						onPress={onSettings}
						style={actionStyle}
						icon={<PixelIcon icon={CogSolid} size={18} color={theme.colors.text} />}
					>
						Réglages
					</Button>
				</>
			}
		/>
	);
}
