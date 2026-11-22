import React from 'react';
import { useSession } from '@/shared/backend/hooks/useSession';
import { SidebarAccount } from '@/features/shell/components/presenters/SidebarAccount';

type SidebarAccountContainerProps = {
	active: boolean;
	onPress: () => void;
};

export function SidebarAccountContainer({ active, onPress }: SidebarAccountContainerProps) {
	const user = useSession((s) => s.user);
	if (!user) return null;

	return (
		<SidebarAccount
			account={{
				name: user.displayName || user.username,
				username: user.username,
				avatarUrl: user.avatarUrl,
			}}
			active={active}
			onPress={onPress}
		/>
	);
}
