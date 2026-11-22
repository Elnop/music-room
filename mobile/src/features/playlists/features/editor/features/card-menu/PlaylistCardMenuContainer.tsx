import React from 'react';
import type { ReactNode } from 'react';
import { usePlaylistCardMenu } from '@/features/playlists/features/editor/features/card-menu/hooks/usePlaylistCardMenu';
import type {
	CardMenuNavigation,
	PlaylistCardMenu,
} from '@/features/playlists/features/editor/features/card-menu/cardMenuTypes';
import { PlaylistActionsSheet } from '@/features/playlists/features/editor/shared/action-sheet/components/PlaylistActionsSheet';
import { useMenuAnchor } from '@/features/playlists/features/editor/shared/menu-anchor/hooks/useMenuAnchor';
import type { PlanState } from '@/features/subscription/lib/subscription';

type PlaylistCardMenuContainerProps = {
	navigation: CardMenuNavigation;
	premium: Pick<PlanState, 'isPremium' | 'refetch'>;
	children: (actionsFor: PlaylistCardMenu['actionsFor']) => ReactNode;
};

export function PlaylistCardMenuContainer({
	navigation,
	premium,
	children,
}: PlaylistCardMenuContainerProps) {
	const menu = usePlaylistCardMenu(navigation, premium);
	const anchor = useMenuAnchor(menu.visible);
	return (
		<>
			{children(menu.actionsFor)}
			{menu.sheet && (
				<PlaylistActionsSheet
					visible={menu.visible}
					anchor={anchor}
					onClose={menu.close}
					menu={menu.sheet}
				/>
			)}
		</>
	);
}
